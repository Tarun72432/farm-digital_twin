package com.company.farmdigitaltwin.controller;

import com.company.farmdigitaltwin.exception.BadRequestException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@RestController
@RequestMapping("/api/assets")
@Tag(name = "Assets", description = "Endpoints for Uploading Photos and Documents")
@Slf4j
public class AssetController {

    private final Path fileStorageLocation = Paths.get("uploads").toAbsolutePath().normalize();

    public AssetController() {
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    @PostMapping("/upload")
    @Operation(summary = "Upload an asset photo (Moringa trees, valves, pumps etc.)")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("Uploaded file is empty");
        }

        // Clean path and generate unique filename
        String originalFileName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        String fileExtension = "";
        
        int i = originalFileName.lastIndexOf('.');
        if (i > 0) {
            fileExtension = originalFileName.substring(i);
        }

        String fileName = UUID.randomUUID().toString() + fileExtension;
        log.info("Received file upload: {}. Saved as: {}", originalFileName, fileName);

        try {
            // Check for invalid characters
            if (fileName.contains("..")) {
                throw new BadRequestException("Filename contains invalid path sequence " + fileName);
            }

            // Copy file to target location
            Path targetLocation = this.fileStorageLocation.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            String fileDownloadUri = "http://localhost:8081/uploads/" + fileName;
            log.info("File saved successfully. Download URL: {}", fileDownloadUri);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "fileName", fileName,
                    "url", fileDownloadUri,
                    "size", file.getSize()
            ));
        } catch (IOException ex) {
            log.error("Failed to store file: {}", fileName, ex);
            throw new RuntimeException("Could not store file " + fileName + ". Please try again!", ex);
        }
    }
}
