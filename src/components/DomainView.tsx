import type { ReactNode } from 'react';
import type { Dataset, DomainId } from '../types';
import { DOMAINS } from '../config/domains';
import { useDomain, useData } from '../data/DataProvider';
import { useI18n } from '../i18n/LangProvider';
import { ErrorView, LoadingView } from './StateViews';
import { EmptyTab } from './EmptyTab';

/**
 * Loads one domain and hands the page a guaranteed-non-null dataset, so pages
 * never repeat the loading / error / empty-tab branches.
 */
export function DomainView({
  domain,
  children,
}: {
  domain: DomainId;
  children: (ds: Dataset) => ReactNode;
}) {
  const { t } = useI18n();
  const { refresh } = useData();
  const { dataset, loading, error } = useDomain(domain);

  if (loading && !dataset) return <LoadingView text={t('state.loading')} />;

  if (error && !dataset) {
    return (
      <ErrorView
        title={t('state.error')}
        desc={t('state.errorDesc')}
        detail={error}
        retryLabel={t('state.retry')}
        onRetry={() => refresh(domain)}
      />
    );
  }

  if (!dataset) return null;
  if (!dataset.rows.length) return <EmptyTab tab={DOMAINS[domain].tab} />;

  return <>{children(dataset)}</>;
}
