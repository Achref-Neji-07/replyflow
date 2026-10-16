package com.replyflow.backend.contact;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/contacts")
@CrossOrigin(origins = "http://localhost:5173")
public class ContactController {

    private final ContactRepository repository;

    public ContactController(ContactRepository repository) {
        this.repository = repository;
    }

    public record CreateContactRequest(
        @NotBlank
        @Size(max = 100)
        String name,

        @NotBlank
        @Pattern(
            regexp = "^\\+[1-9]\\d{7,14}$",
            message = "Utilise un numéro international, exemple : +21612345678"
        )
        String phone
    ) {
    }

    @GetMapping
    public List<Contact> getContacts() {
        return repository.findAll(
            Sort.by(Sort.Direction.DESC, "id")
        );
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Contact createContact(
        @Valid @RequestBody CreateContactRequest request
    ) {
        Contact contact = new Contact(
            request.name().trim(),
            request.phone()
        );

        try {
            return repository.saveAndFlush(contact);
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Impossible d’ajouter ce contact : numéro déjà utilisé ou données incompatibles."
            );
        }
    }
    @DeleteMapping("/{id}")
@ResponseStatus(HttpStatus.NO_CONTENT)
public void deleteContact(@PathVariable("id") Long id) {
    Contact contact = repository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "Contact introuvable"
        ));

    repository.delete(contact);
}
}