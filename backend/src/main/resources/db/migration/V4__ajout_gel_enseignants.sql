create table gel_enseignants (
    id bigint not null primary key,
    actif boolean not null default false,
    date_fin timestamp
);
