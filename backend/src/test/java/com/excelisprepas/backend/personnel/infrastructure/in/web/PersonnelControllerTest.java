package com.excelisprepas.backend.personnel.infrastructure.in.web;

import com.excelisprepas.backend.personnel.domain.model.Personnel;
import com.excelisprepas.backend.personnel.domain.port.in.ConsulterHistoriqueSalairePersonnelUseCase;
import com.excelisprepas.backend.personnel.domain.port.in.CreerPersonnelUseCase;
import com.excelisprepas.backend.personnel.domain.port.in.DefinirSalairePersonnelUseCase;
import com.excelisprepas.backend.personnel.domain.port.in.ListerPersonnelUseCase;
import com.excelisprepas.backend.personnel.domain.port.in.RecupererPersonnelUseCase;
import com.excelisprepas.backend.shared.exception.PersonnelIntrouvableException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import com.excelisprepas.backend.shared.testsupport.TokenPortTestConfig;
import org.springframework.context.annotation.Import;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc(addFilters = false)
@Import(TokenPortTestConfig.class)
@WebMvcTest(PersonnelController.class)
class PersonnelControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CreerPersonnelUseCase creerPersonnelUseCase;

    @MockitoBean
    private RecupererPersonnelUseCase recupererPersonnelUseCase;

    @MockitoBean
    private ListerPersonnelUseCase listerPersonnelUseCase;

    @MockitoBean
    private DefinirSalairePersonnelUseCase definirSalairePersonnelUseCase;

    @MockitoBean
    private ConsulterHistoriqueSalairePersonnelUseCase consulterHistoriqueSalairePersonnelUseCase;

    @Test
    @DisplayName("GET /api/personnel/{id} retourne 200 avec les informations du membre")
    void recupererPersonnel_existant_retourne200() throws Exception {
        UUID id = UUID.randomUUID();
        Personnel personnel = new Personnel(id, "Doe", "John", "+237699999999", "123456789", "john.doe@excelis.cm");
        when(recupererPersonnelUseCase.recupererPersonnel(id)).thenReturn(personnel);

        mockMvc.perform(get("/api/personnel/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id.toString()))
                .andExpect(jsonPath("$.nom").value("Doe"))
                .andExpect(jsonPath("$.prenom").value("John"))
                .andExpect(jsonPath("$.email").value("john.doe@excelis.cm"))
                .andExpect(jsonPath("$.telephone").value("+237699999999"))
                .andExpect(jsonPath("$.numeroCni").value("123456789"));
    }

    @Test
    @DisplayName("GET /api/personnel/{id} retourne 404 si le membre est introuvable")
    void recupererPersonnel_introuvable_retourne404() throws Exception {
        UUID id = UUID.randomUUID();
        when(recupererPersonnelUseCase.recupererPersonnel(id)).thenThrow(new PersonnelIntrouvableException(id));

        mockMvc.perform(get("/api/personnel/" + id))
                .andExpect(status().isNotFound());
    }
}
