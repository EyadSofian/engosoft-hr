/**
 * Engosoft HR — Sheet write-back API
 * =================================================================
 * A Google Apps Script Web App bound to the HR spreadsheet. The dashboard
 * READS through the public gviz endpoint and WRITES through this script, so the
 * Google Sheet stays the single source of truth: whatever the dashboard changes
 * is immediately visible to anyone working directly in Sheets, and vice-versa.
 *
 * Deploy
 * ------
 *  1. Open the spreadsheet → Extensions → Apps Script, paste this file.
 *  2. Project Settings → Script properties → add  API_TOKEN  = <a long secret>.
 *  3. Deploy → New deployment → Web app
 *       Execute as:        Me
 *       Who has access:    Anyone
 *  4. Copy the /exec URL into the dashboard's VITE_WRITE_API_URL, and the same
 *     token into VITE_WRITE_API_TOKEN.
 *
 * Requests are sent as Content-Type: text/plain so the browser treats them as
 * simple requests — Apps Script cannot answer CORS preflight, so this matters.
 * The token travels in the JSON body, never in the query string.
 */

var AUDIT_SHEET = '_Audit';
var MAX_BATCH = 200;

// ── Entry points ─────────────────────────────────────────────────────────────

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'ping';
  if (action === 'ping') return json({ ok: true, service: 'engosoft-hr-write-api', version: 1 });
  return json({ ok: false, error: 'Use POST for write actions.' }, 400);
}

function doPost(e) {
  var req;
  try {
    req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json({ ok: false, error: 'Malformed JSON body.' }, 400);
  }

  if (!checkToken(req.token)) return json({ ok: false, error: 'Unauthorized.' }, 401);

  var lock = LockService.getScriptLock();
  try {
    // Concurrent writers must not interleave a read-modify-write on a row.
    lock.waitLock(20000);
  } catch (err) {
    return json({ ok: false, error: 'Sheet is busy, please retry.' }, 503);
  }

  try {
    switch (req.action) {
      case 'meta':   return json(handleMeta());
      case 'update': return json(handleUpdate(req));
      case 'append': return json(handleAppend(req));
      case 'batch':  return json(handleBatch(req));
      default:       return json({ ok: false, error: 'Unknown action: ' + req.action }, 400);
    }
  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err) }, 500);
  } finally {
    lock.releaseLock();
  }
}

// ── Actions ──────────────────────────────────────────────────────────────────

/** List every tab with its headers — lets the dashboard validate before writing. */
function handleMeta() {
  var tabs = SpreadsheetApp.getActive().getSheets()
    .filter(function (s) { return s.getName().charAt(0) !== '_'; })
    .map(function (s) {
      return {
        name: s.getName(),
        rows: Math.max(0, s.getLastRow() - 1),
        headers: headersOf(s),
      };
    });
  return { ok: true, tabs: tabs };
}

/**
 * Patch named columns on the row whose key column holds `key`.
 * { action:'update', sheet:'Recruitment', key:'REQ-0007', keyColumn:'RID',
 *   patch:{ Status:'Done', 'Actual Hiring Date':'2026-07-30' }, actor:'yasmin' }
 */
function handleUpdate(req) {
  var sheet = mustSheet(req.sheet);
  var headers = headersOf(sheet);
  var keyColumn = req.keyColumn || 'RID';
  var rowIndex = findRow(sheet, headers, keyColumn, req.key);
  if (rowIndex < 0) throw new Error('No row where ' + keyColumn + ' = ' + req.key);

  var written = applyPatch(sheet, headers, rowIndex, req.patch || {}, req.actor);
  audit(req.actor, 'update', sheet.getName(), req.key, req.patch);
  return { ok: true, sheet: sheet.getName(), key: req.key, row: rowIndex, written: written };
}

/**
 * Append a record. Missing columns are left blank; unknown keys are rejected so
 * a typo cannot silently create a column-shifted row.
 */
function handleAppend(req) {
  var sheet = mustSheet(req.sheet);
  var headers = headersOf(sheet);
  var values = req.values || {};

  var unknown = Object.keys(values).filter(function (k) { return headers.indexOf(k) < 0; });
  if (unknown.length) throw new Error('Unknown column(s): ' + unknown.join(', '));

  var rid = values.RID;
  if (headers.indexOf('RID') >= 0 && !rid) {
    rid = nextRid(sheet, headers, req.ridPrefix || sheet.getName().slice(0, 3).toUpperCase());
    values.RID = rid;
  }
  stamp(values, headers, req.actor);

  var row = headers.map(function (h) {
    return values[h] === undefined || values[h] === null ? '' : values[h];
  });
  sheet.appendRow(row);
  audit(req.actor, 'append', sheet.getName(), rid || '', values);
  return { ok: true, sheet: sheet.getName(), key: rid || '', row: sheet.getLastRow() };
}

/** Apply many updates in one round trip — used by drag-and-drop reordering. */
function handleBatch(req) {
  var ops = req.ops || [];
  if (ops.length > MAX_BATCH) throw new Error('Batch too large (max ' + MAX_BATCH + ').');

  var results = ops.map(function (op) {
    try {
      var sheet = mustSheet(op.sheet || req.sheet);
      var headers = headersOf(sheet);
      var keyColumn = op.keyColumn || req.keyColumn || 'RID';
      var rowIndex = findRow(sheet, headers, keyColumn, op.key);
      if (rowIndex < 0) return { ok: false, key: op.key, error: 'Row not found.' };
      applyPatch(sheet, headers, rowIndex, op.patch || {}, req.actor);
      return { ok: true, key: op.key, row: rowIndex };
    } catch (err) {
      return { ok: false, key: op.key, error: String(err && err.message || err) };
    }
  });

  var failed = results.filter(function (r) { return !r.ok; });
  audit(req.actor, 'batch', req.sheet || '(mixed)', ops.length + ' ops',
        { failed: failed.length });
  return { ok: failed.length === 0, results: results, failed: failed.length };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function checkToken(token) {
  var expected = PropertiesService.getScriptProperties().getProperty('API_TOKEN');
  if (!expected) throw new Error('API_TOKEN script property is not set.');
  if (!token || token.length !== expected.length) return false;
  // Constant-time compare so a wrong token leaks nothing through timing.
  var diff = 0;
  for (var i = 0; i < expected.length; i++) diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

function mustSheet(name) {
  if (!name) throw new Error('Missing "sheet".');
  if (String(name).charAt(0) === '_') throw new Error('Internal sheets are not writable.');
  var sheet = SpreadsheetApp.getActive().getSheetByName(name);
  if (!sheet) throw new Error('No tab named "' + name + '".');
  return sheet;
}

function headersOf(sheet) {
  if (sheet.getLastColumn() === 0) return [];
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    .map(function (h) { return String(h).trim(); });
}

/** 1-based sheet row of the record with this key, or -1. */
function findRow(sheet, headers, keyColumn, key) {
  var col = headers.indexOf(keyColumn);
  if (col < 0) throw new Error('No column named "' + keyColumn + '".');
  if (sheet.getLastRow() < 2) return -1;
  var column = sheet.getRange(2, col + 1, sheet.getLastRow() - 1, 1).getValues();
  var needle = String(key).trim();
  for (var i = 0; i < column.length; i++) {
    if (String(column[i][0]).trim() === needle) return i + 2;
  }
  return -1;
}

function applyPatch(sheet, headers, rowIndex, patch, actor) {
  var unknown = Object.keys(patch).filter(function (k) { return headers.indexOf(k) < 0; });
  if (unknown.length) throw new Error('Unknown column(s): ' + unknown.join(', '));

  var values = {};
  Object.keys(patch).forEach(function (k) { values[k] = patch[k]; });
  stamp(values, headers, actor);

  var written = [];
  Object.keys(values).forEach(function (k) {
    var col = headers.indexOf(k);
    if (col < 0) return;
    sheet.getRange(rowIndex, col + 1).setValue(values[k]);
    written.push(k);
  });
  return written;
}

/** Fill the bookkeeping columns the sheet happens to have. */
function stamp(values, headers, actor) {
  var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
  if (headers.indexOf('Updated At') >= 0) values['Updated At'] = now;
  if (headers.indexOf('Updated By') >= 0 && actor) values['Updated By'] = actor;
  if (values.Status === 'Done') {
    if (headers.indexOf('Closed At') >= 0 && !values['Closed At']) values['Closed At'] = now;
    if (headers.indexOf('Closed By') >= 0 && actor) values['Closed By'] = actor;
  }
}

function nextRid(sheet, headers, prefix) {
  var col = headers.indexOf('RID');
  var max = 0;
  if (col >= 0 && sheet.getLastRow() > 1) {
    sheet.getRange(2, col + 1, sheet.getLastRow() - 1, 1).getValues().forEach(function (r) {
      var m = String(r[0]).match(/-(\d+)$/);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
  }
  return prefix + '-' + ('0000' + (max + 1)).slice(-4);
}

/** Every write is recorded, so a surprising value can always be traced back. */
function audit(actor, action, sheetName, key, payload) {
  try {
    var ss = SpreadsheetApp.getActive();
    var log = ss.getSheetByName(AUDIT_SHEET);
    if (!log) {
      log = ss.insertSheet(AUDIT_SHEET);
      log.appendRow(['At', 'Actor', 'Action', 'Sheet', 'Key', 'Payload']);
      log.setFrozenRows(1);
      log.hideSheet();
    }
    log.appendRow([
      Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'),
      actor || 'unknown', action, sheetName, key, JSON.stringify(payload || {}).slice(0, 4000),
    ]);
  } catch (err) {
    // Auditing must never fail the write it is describing.
  }
}

function json(payload, status) {
  if (status && status >= 400 && payload.ok === undefined) payload.ok = false;
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
