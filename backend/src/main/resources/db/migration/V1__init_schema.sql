
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

    create table utilisateurs (
        centre_id uuid,
        id uuid not null,
        email varchar(255) not null unique,
        mot_de_passe_hash varchar(255) not null,
        role varchar(255) not null check ((role in ('DIRECTEUR','DIRECTEUR_ACADEMIQUE','CHEF_CENTRE','CHEF_DEPARTEMENT','CHARGE_DOSSIER','SUPERVISEUR_DOSSIERS','CAISSIER','COMPTABLE'))),
        primary key (id)
    );

    alter table if exists enseignants 
       add constraint FKeuxc6j7dda1k7lioar5x54qbc 
       foreign key (id) 
       references personnel;

    alter table if exists utilisateurs 
       add constraint FKm6u31ywavy2xcrnp5l8aer4et 
       foreign key (id) 
       references personnel;

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

    create table utilisateurs (
        centre_id uuid,
        id uuid not null,
        email varchar(255) not null unique,
        mot_de_passe_hash varchar(255) not null,
        role varchar(255) not null check ((role in ('DIRECTEUR','DIRECTEUR_ACADEMIQUE','CHEF_CENTRE','CHEF_DEPARTEMENT','CHARGE_DOSSIER','SUPERVISEUR_DOSSIERS','CAISSIER','COMPTABLE'))),
        primary key (id)
    );

    alter table if exists enseignants 
       add constraint FKeuxc6j7dda1k7lioar5x54qbc 
       foreign key (id) 
       references personnel;

    alter table if exists utilisateurs 
       add constraint FKm6u31ywavy2xcrnp5l8aer4et 
       foreign key (id) 
       references personnel;
