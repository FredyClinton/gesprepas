
    create table enseignants (
        cout_par_seance numeric(12,2) not null,
        id uuid not null,
        matricule varchar(255) not null unique,
        primary key (id)
    );

    create table personnel (
        id uuid not null,
        mode_calcul_paie varchar(255) check ((mode_calcul_paie in ('FIXE','PAR_SEANCE'))),
        nom varchar(255),
        prenom varchar(255),
        primary key (id)
    );

    alter table if exists enseignants 
       add constraint FKeuxc6j7dda1k7lioar5x54qbc 
       foreign key (id) 
       references personnel;
