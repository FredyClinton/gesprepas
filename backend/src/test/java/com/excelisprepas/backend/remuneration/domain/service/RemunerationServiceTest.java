package com.excelisprepas.backend.remuneration.domain.service;

import com.excelisprepas.backend.academie.affectation.domain.model.Affectation;
import com.excelisprepas.backend.academie.affectation.domain.model.Jour;
import com.excelisprepas.backend.academie.affectation.domain.model.StatutAffectation;
import com.excelisprepas.backend.academie.affectation.domain.model.StatutPaiement;
import com.excelisprepas.backend.academie.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.academie.affectationdepartementale.domain.port.out.AffectationDepartementaleRepositoryPort;
import com.excelisprepas.backend.academie.departement.domain.port.out.DepartementRepositoryPort;
import com.excelisprepas.backend.academie.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.academie.matiere.domain.port.out.MatiereRepositoryPort;
import com.excelisprepas.backend.academie.salle.domain.port.out.SalleRepositoryPort;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.financier.domain.model.Sortie;
import com.excelisprepas.backend.financier.domain.port.in.SaisirSortieUseCase;
import com.excelisprepas.backend.personnel.domain.model.Enseignant;
import com.excelisprepas.backend.personnel.domain.port.out.EnseignantRepositoryPort;
import com.excelisprepas.backend.personnel.domain.port.out.HistoriqueTarifRepositoryPort;
import com.excelisprepas.backend.remuneration.domain.model.*;
import com.excelisprepas.backend.remuneration.domain.port.out.BordereauPaieRepositoryPort;
import com.excelisprepas.backend.remuneration.infrastructure.in.web.dto.FichePaieDetailResponse;
import com.excelisprepas.backend.remuneration.infrastructure.in.web.dto.SeanceFichePaieItemResponse;
import com.excelisprepas.backend.remuneration.infrastructure.out.persistence.FichePaieEnseignantJpaRepository;
import com.excelisprepas.backend.academie.progression.infrastructure.out.persistence.ProgressionJpaRepository;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class RemunerationServiceTest {

    private AffectationRepositoryPort affectationRepository;
    private EnseignantRepositoryPort enseignantRepository;
    private HistoriqueTarifRepositoryPort historiqueTarifRepository;
    private BordereauPaieRepositoryPort bordereauPaieRepository;
    private SaisirSortieUseCase saisirSortieUseCase;
    private AffectationDepartementaleRepositoryPort rosterRepository;
    private DepartementRepositoryPort departementRepository;
    private FormationRepositoryPort formationRepository;
    private MatiereRepositoryPort matiereRepository;
    private CentreRepositoryPort centreRepository;
    private SalleRepositoryPort salleRepository;
    private SessionAcademiqueRepositoryPort sessionRepository;
    private ProgressionJpaRepository progressionJpaRepository;
    private FichePaieEnseignantJpaRepository fichePaieJpaRepository;

    private RemunerationService service;

    @BeforeEach
    void setUp() {
        affectationRepository = mock(AffectationRepositoryPort.class);
        enseignantRepository = mock(EnseignantRepositoryPort.class);
        historiqueTarifRepository = mock(HistoriqueTarifRepositoryPort.class);
        bordereauPaieRepository = mock(BordereauPaieRepositoryPort.class);
        saisirSortieUseCase = mock(SaisirSortieUseCase.class);
        rosterRepository = mock(AffectationDepartementaleRepositoryPort.class);
        departementRepository = mock(DepartementRepositoryPort.class);
        formationRepository = mock(FormationRepositoryPort.class);
        matiereRepository = mock(MatiereRepositoryPort.class);
        centreRepository = mock(CentreRepositoryPort.class);
        salleRepository = mock(SalleRepositoryPort.class);
        sessionRepository = mock(SessionAcademiqueRepositoryPort.class);
        progressionJpaRepository = mock(ProgressionJpaRepository.class);
        fichePaieJpaRepository = mock(FichePaieEnseignantJpaRepository.class);

        service = new RemunerationService(
                affectationRepository, enseignantRepository, historiqueTarifRepository,
                bordereauPaieRepository, saisirSortieUseCase,
                rosterRepository, departementRepository, formationRepository, matiereRepository,
                centreRepository, salleRepository, sessionRepository,
                progressionJpaRepository, fichePaieJpaRepository);
    }

    @Test
    @DisplayName("preparerDecompte() regroupe les séances effectuées non payées et applique le coût contractuel")
    void preparerDecompteFonctionne() {
        UUID sessionId = UUID.randomUUID();
        UUID ensId = UUID.randomUUID();

        Enseignant enseignant = new Enseignant(ensId, "Kouam", "Jean", "ENS-01", new BigDecimal("15000"));
        when(enseignantRepository.findById(ensId)).thenReturn(Optional.of(enseignant));
        when(historiqueTarifRepository.findTarifApplicable(eq(ensId), eq(sessionId), anyInt())).thenReturn(Optional.empty());

        Affectation aff1 = Affectation.reconstituer(UUID.randomUUID(), UUID.randomUUID(), sessionId, UUID.randomUUID(),
                UUID.randomUUID(), UUID.randomUUID(), ensId, Jour.LUNDI, 1, 2,
                StatutAffectation.EFFECTUEE, StatutPaiement.NON_PAYEE, null, null);
        Affectation aff2 = Affectation.reconstituer(UUID.randomUUID(), UUID.randomUUID(), sessionId, UUID.randomUUID(),
                UUID.randomUUID(), UUID.randomUUID(), ensId, Jour.MERCREDI, 2, 2,
                StatutAffectation.EFFECTUEE, StatutPaiement.NON_PAYEE, null, null);

        when(affectationRepository.findBySessionIdAndStatutAndStatutPaiement(sessionId, StatutAffectation.EFFECTUEE, StatutPaiement.NON_PAYEE))
                .thenReturn(List.of(aff1, aff2));

        BordereauPaie bordereau = service.preparerDecompte(sessionId, LocalDate.now(), "DIRECTEUR");

        assertThat(bordereau).isNotNull();
        assertThat(bordereau.getNombreTotalEnseignants()).isEqualTo(1);
        assertThat(bordereau.getNombreTotalSeances()).isEqualTo(2);
        assertThat(bordereau.getMontantTotalGlobal()).isEqualByComparingTo(new BigDecimal("30000"));
    }

    @Test
    @DisplayName("validerBordereau() avec modification de contrat enregistre le bordereau, crée la Sortie financière et verrouille les affectations")
    void validerBordereauAvecAjustementTarif() {
        UUID sessionId = UUID.randomUUID();
        UUID ensId = UUID.randomUUID();

        Enseignant enseignant = new Enseignant(ensId, "Kouam", "Jean", "ENS-01", new BigDecimal("15000"));
        when(enseignantRepository.findById(ensId)).thenReturn(Optional.of(enseignant));

        Affectation aff1 = Affectation.reconstituer(UUID.randomUUID(), UUID.randomUUID(), sessionId, UUID.randomUUID(),
                UUID.randomUUID(), UUID.randomUUID(), ensId, Jour.LUNDI, 1, 2,
                StatutAffectation.EFFECTUEE, StatutPaiement.NON_PAYEE, null, null);
        Affectation aff2 = Affectation.reconstituer(UUID.randomUUID(), UUID.randomUUID(), sessionId, UUID.randomUUID(),
                UUID.randomUUID(), UUID.randomUUID(), ensId, Jour.MERCREDI, 2, 2,
                StatutAffectation.EFFECTUEE, StatutPaiement.NON_PAYEE, null, null);

        when(affectationRepository.findBySessionIdAndStatutAndStatutPaiement(sessionId, StatutAffectation.EFFECTUEE, StatutPaiement.NON_PAYEE))
                .thenReturn(List.of(aff1, aff2));

        Sortie mockSortie = new Sortie(UUID.randomUUID(), sessionId, UUID.randomUUID(), new BigDecimal("40000"),
                LocalDate.now(), UUID.randomUUID(), null, "DIRECTEUR");
        when(saisirSortieUseCase.saisirSortie(any(), any(), any(), any(), any(), any(), any())).thenReturn(mockSortie);

        when(bordereauPaieRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // Ajustement du tarif à 20 000 FCFA par séance au lieu de 15 000
        LigneAjustementPaieEnseignant ajustement = new LigneAjustementPaieEnseignant(
                ensId, new BigDecimal("20000"), List.of(aff1.getId(), aff2.getId()));

        BordereauPaie valide = service.validerBordereau(sessionId, LocalDate.now(), "BORD-TEST-001", List.of(ajustement), "DIRECTEUR");

        assertThat(valide).isNotNull();
        assertThat(valide.getMontantTotalGlobal()).isEqualByComparingTo(new BigDecimal("40000"));
        verify(saisirSortieUseCase).saisirSortie(eq(sessionId), any(), eq(new BigDecimal("40000")), any(), any(), isNull(), eq("DIRECTEUR"));
        verify(affectationRepository, times(2)).save(any(Affectation.class));
    }

    @Test
    @DisplayName("executerPaiement() marque la fiche et les affectations comme PAYEE")
    void executerPaiementPasseStatutsEnPayee() {
        UUID bordereauId = UUID.randomUUID();
        UUID ficheId = UUID.randomUUID();
        UUID ensId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();

        FichePaieEnseignant fiche = new FichePaieEnseignant(ficheId, bordereauId, ensId, List.of());
        BordereauPaie bordereau = new BordereauPaie(bordereauId, sessionId, "BORD-001", LocalDate.now(), List.of(fiche), UUID.randomUUID(), "DIRECTEUR");

        when(bordereauPaieRepository.findById(bordereauId)).thenReturn(Optional.of(bordereau));

        Affectation aff1 = Affectation.reconstituer(UUID.randomUUID(), UUID.randomUUID(), sessionId, UUID.randomUUID(),
                UUID.randomUUID(), UUID.randomUUID(), ensId, Jour.LUNDI, 1, 2,
                StatutAffectation.EFFECTUEE, StatutPaiement.PROGRAMMEE, new BigDecimal("15000"), ficheId);
        when(affectationRepository.findByFichePaieId(ficheId)).thenReturn(List.of(aff1));

        service.executerPaiement(bordereauId, ficheId, "CAISSIER");

        assertThat(fiche.getStatut()).isEqualTo(StatutFichePaie.PAYEE);
        assertThat(aff1.getStatutPaiement()).isEqualTo(StatutPaiement.PAYEE);
        verify(affectationRepository).save(aff1);
        verify(bordereauPaieRepository).save(bordereau);
    }

    @Test
    @DisplayName("recupererFicheDetail() retourne les détails enrichis de chaque séance (date, horaire, durée, matière, formation, salle)")
    void recupererFicheDetailRetourneLesDetailsCompletsDesSeances() {
        UUID bordereauId = UUID.randomUUID();
        UUID ficheId = UUID.randomUUID();
        UUID ensId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        UUID formationId = UUID.randomUUID();
        UUID matiereId = UUID.randomUUID();
        UUID centreId = UUID.randomUUID();
        UUID salleId = UUID.randomUUID();

        Enseignant enseignant = new Enseignant(ensId, "Tchoupo", "Eric", "ENS-02", new BigDecimal("18000"));
        when(enseignantRepository.findById(ensId)).thenReturn(Optional.of(enseignant));

        Affectation aff = Affectation.reconstituer(UUID.randomUUID(), centreId, sessionId, formationId,
                salleId, matiereId, ensId, Jour.MARDI, 1, 3,
                StatutAffectation.EFFECTUEE, StatutPaiement.PROGRAMMEE, new BigDecimal("18000"), ficheId);
        when(affectationRepository.findByFichePaieId(ficheId)).thenReturn(List.of(aff));

        com.excelisprepas.backend.session.domain.model.SessionAcademique session =
                new com.excelisprepas.backend.session.domain.model.SessionAcademique(
                        sessionId, "2026-2027", LocalDate.of(2026, 9, 1), LocalDate.of(2027, 6, 30));
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

        com.excelisprepas.backend.academie.formation.domain.model.Formation formation =
                mock(com.excelisprepas.backend.academie.formation.domain.model.Formation.class);
        when(formation.getNom()).thenReturn("Prépa PCSI");
        when(formationRepository.findById(formationId)).thenReturn(Optional.of(formation));

        com.excelisprepas.backend.academie.matiere.domain.model.Matiere matiere =
                mock(com.excelisprepas.backend.academie.matiere.domain.model.Matiere.class);
        when(matiere.getNom()).thenReturn("Physique-Chimie");
        when(matiereRepository.findById(matiereId)).thenReturn(Optional.of(matiere));

        com.excelisprepas.backend.centre.domain.model.Centre centre =
                mock(com.excelisprepas.backend.centre.domain.model.Centre.class);
        when(centre.getNom()).thenReturn("Centre Douala");
        when(centreRepository.findById(centreId)).thenReturn(Optional.of(centre));

        com.excelisprepas.backend.academie.salle.domain.model.Salle salle =
                mock(com.excelisprepas.backend.academie.salle.domain.model.Salle.class);
        when(salle.getNom()).thenReturn("Salle Ampère");
        when(salleRepository.findById(salleId)).thenReturn(Optional.of(salle));

        FichePaieDetailResponse detail = service.recupererFicheDetail(ficheId);

        assertThat(detail).isNotNull();
        assertThat(detail.enseignantNom()).isEqualTo("Tchoupo");
        assertThat(detail.nombreSeances()).isEqualTo(1);
        assertThat(detail.seances()).hasSize(1);

        SeanceFichePaieItemResponse seanceItem = detail.seances().get(0);
        assertThat(seanceItem.formationNom()).isEqualTo("Prépa PCSI");
        assertThat(seanceItem.matiereNom()).isEqualTo("Physique-Chimie");
        assertThat(seanceItem.centreNom()).isEqualTo("Centre Douala");
        assertThat(seanceItem.salleNom()).isEqualTo("Salle Ampère");
        assertThat(seanceItem.horaire()).isEqualTo("08h00 - 10h30");
        assertThat(seanceItem.duree()).isEqualTo("2h30");
        assertThat(seanceItem.dateSeance()).isEqualTo(LocalDate.of(2026, 9, 1).plusDays((3 - 1) * 7 + 1));
        assertThat(seanceItem.coutApplique()).isEqualByComparingTo(new BigDecimal("18000"));
    }

    @Test
    @DisplayName("mettreAJourThemeSeance() met à jour le thème d'une progression existante")
    void mettreAJourThemeSeanceMetAJourProgressionExistante() {
        UUID affId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        UUID formationId = UUID.randomUUID();
        UUID matiereId = UUID.randomUUID();
        UUID salleId = UUID.randomUUID();

        Affectation aff = Affectation.reconstituer(affId, UUID.randomUUID(), sessionId, formationId,
                salleId, matiereId, UUID.randomUUID(), Jour.LUNDI, 1, 1,
                StatutAffectation.EFFECTUEE, StatutPaiement.PAYEE, null, null);

        when(affectationRepository.findById(affId)).thenReturn(Optional.of(aff));
        when(affectationRepository.findBySessionIdAndSemaine(sessionId, 1)).thenReturn(List.of(aff));

        com.excelisprepas.backend.academie.progression.infrastructure.out.persistence.ProgressionEntity prog =
                new com.excelisprepas.backend.academie.progression.infrastructure.out.persistence.ProgressionEntity();
        prog.setTheme("Ancien thème");
        when(progressionJpaRepository.findFirstByFormationIdAndMatiereIdAndSemaineAndNumeroCours(formationId, matiereId, 1, 1))
                .thenReturn(Optional.of(prog));

        service.mettreAJourThemeSeance(affId, "Nouveau thème de cours");

        assertThat(prog.getTheme()).isEqualTo("Nouveau thème de cours");
        verify(progressionJpaRepository).save(prog);
    }
}
