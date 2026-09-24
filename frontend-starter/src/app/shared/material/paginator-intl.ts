import { MatPaginatorIntl } from '@angular/material/paginator';

/** French labels for the Material paginator. */
export function frenchPaginatorIntl(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();

  intl.itemsPerPageLabel = 'Pistes par page :';
  intl.previousPageLabel = 'Page précédente';
  intl.nextPageLabel = 'Page suivante';
  intl.firstPageLabel = 'Première page';
  intl.lastPageLabel = 'Dernière page';

  intl.getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0) return 'Aucune piste';

    const start = page * pageSize + 1;
    const end = Math.min((page + 1) * pageSize, length);
    return `${start} – ${end} sur ${length}`;
  };

  return intl;
}
