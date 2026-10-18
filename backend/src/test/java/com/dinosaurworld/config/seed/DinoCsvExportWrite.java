package com.dinosaurworld.config.seed;

import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

/** Uso único: gera seed/dinosauromorpha.csv a partir do roster Java. */
public final class DinoCsvExportWrite {

    private DinoCsvExportWrite() {
    }

    public static void main(String[] args) throws Exception {
        Path destino = Path.of("src/main/resources/seed/dinosauromorpha.csv");
        Files.createDirectories(destino.getParent());
        try (Writer writer = Files.newBufferedWriter(destino, StandardCharsets.UTF_8)) {
            DinoCsvExport.escrever(RosterCatalog.raiz(), writer);
        }
        System.out.println("Escrito " + destino.toAbsolutePath());
    }
}
