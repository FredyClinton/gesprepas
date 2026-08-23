package com.excelisprepas.backend.departement.infrastructure.in.web;

import com.excelisprepas.backend.departement.domain.model.Departement;
import com.excelisprepas.backend.departement.domain.port.in.CreerDepartementUseCase;
import com.excelisprepas.backend.departement.infrastructure.in.web.dto.CreerDepartementRequest;
import com.excelisprepas.backend.departement.infrastructure.in.web.dto.DepartementResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/departements")
public class DepartementController {

    private final CreerDepartementUseCase creerDepartementUseCase;

    public DepartementController(CreerDepartementUseCase creerDepartementUseCase) {
        this.creerDepartementUseCase = creerDepartementUseCase;
    }

    @PostMapping
    public ResponseEntity<DepartementResponse> creerDepartement(@Valid @RequestBody CreerDepartementRequest request) {
        Departement departement = creerDepartementUseCase.creerDepartement(
                request.nomDepartement(), request.nomMatiere());

        DepartementResponse response = new DepartementResponse(
                departement.getId(), departement.getNom(), departement.getMatiereId());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}