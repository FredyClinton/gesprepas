package com.excelisprepas.backend.centre.domain.service;


import com.excelisprepas.backend.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.centre.domain.exception.CentreUtiliseException;
import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.port.in.*;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.personnel.domain.port.out.UtilisateurRepositoryPort;
import com.excelisprepas.backend.salle.domain.port.out.SalleRepositoryPort;
import com.excelisprepas.backend.shared.exception.CentreIntrouvableException;

import java.util.List;
import java.util.UUID;

public class CentreService implements CreerCentreUseCase, RecupererCentreUseCase,
        ListerCentresUseCase, FermerCentreUseCase, RenommerCentreUseCase,
        RelocaliserCentreUseCase, RouvrirCentreUseCase, SupprimerCentreUseCase {

    private final CentreRepositoryPort centreRepository;
    private final FormationRepositoryPort formationRepository;
    private final ApprenantRepositoryPort apprenantRepository;
    private final SalleRepositoryPort salleRepository;
    private final AffectationRepositoryPort affectationRepository;
    private final UtilisateurRepositoryPort utilisateurRepository;

    public CentreService(CentreRepositoryPort centreRepository, FormationRepositoryPort formationRepository, ApprenantRepositoryPort apprenantRepository, SalleRepositoryPort salleRepository, AffectationRepositoryPort affectationRepository, UtilisateurRepositoryPort utilisateurRepository) {
        this.centreRepository = centreRepository;
        this.formationRepository = formationRepository;
        this.apprenantRepository = apprenantRepository;
        this.salleRepository = salleRepository;
        this.affectationRepository = affectationRepository;
        this.utilisateurRepository = utilisateurRepository;
    }

    @Override
    public Centre creerCentre(String nom, String adresseInitiale, String villeInitiale) {
        Centre centre = new Centre(UUID.randomUUID(), nom, adresseInitiale, villeInitiale);
        return centreRepository.save(centre);
    }

    @Override
    public Centre recupererCentre(UUID id) {
        return centreRepository.findById(id)
                .orElseThrow(() -> new CentreIntrouvableException(id));
    }

    @Override
    public List<Centre> listerCentres() {
        return centreRepository.findAll();
    }

    @Override
    public Centre fermerCentre(UUID id) {
        Centre centre = recupererCentre(id);
        centre.fermer();
        return centreRepository.save(centre);
    }

    @Override
    public Centre renommerCentre(UUID id, String nouveauNom) {
        Centre centre = recupererCentre(id);
        centre.renommer(nouveauNom);
        return centreRepository.save(centre);
    }


    @Override
    public Centre relocaliserCentre(UUID id, String nouvelleAdresse, String nouvelleVille) {
        Centre centre = recupererCentre(id);
        centre.relocaliser(nouvelleAdresse, nouvelleVille);
        return centreRepository.save(centre);
    }


    @Override
    public void supprimerCentre(UUID id) {
        // Verifie si le centre existe sinon lever une exception
        recupererCentre(id);
        boolean referencerAilleurs = this.formationRepository.existsByCentreId(id)
                || apprenantRepository.existsByCentreId(id)
                || salleRepository.existsByCentreId(id)
                || affectationRepository.existsByCentreId(id)
                || utilisateurRepository.existsByCentreId(id);

        if (referencerAilleurs) {
            throw new CentreUtiliseException(id);
        }
        centreRepository.deleteById(id);
    }

    @Override
    public Centre rouvrirCentre(UUID id) {
        Centre centre = recupererCentre(id);
        centre.rouvrir();
        return centreRepository.save(centre);
    }
}
