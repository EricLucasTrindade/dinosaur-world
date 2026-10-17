package com.dinosaurworld.config.enrichment;

import com.dinosaurworld.domain.Taxon;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Perfil sonoro a partir da linhagem. Ficheiro com o nome do clado
 * vence o perfil partilhado (PT). CSV pontual cobre género avulso.
 * Não inventa som para clado sem regra.
 */
public final class SomPorClado {

    private static final Pattern ARQUIVO_OK = Pattern.compile("[a-zA-Z0-9_-]+\\.mp3");
    private static final Map<String, String> POR_CLADO = new HashMap<String, String>();

    static {
        // --- Ornithischia (slots já existentes) ---
        POR_CLADO.put("hadrosauridae", "hadrosauridae.mp3");
        POR_CLADO.put("hadrosauroidea", "hadrosauroidea.mp3");

        POR_CLADO.put("ceratopsidae", "ceratopsidae.mp3");
        POR_CLADO.put("protoceratopsidae", "protoceratopsidae.mp3");
        POR_CLADO.put("leptoceratopsidae", "leptoceratopsidae.mp3");
        POR_CLADO.put("coronosauria", "coronosauria.mp3");
        POR_CLADO.put("ceratopsia", "ceratopsio.mp3");
        POR_CLADO.put("pachycephalosauria", "pachycephalosauria.mp3");

        POR_CLADO.put("ankylosauridae", "ankylosauridae.mp3");
        POR_CLADO.put("nodosauridae", "nodosauridae.mp3");
        POR_CLADO.put("parankylosauria", "parankylosauria.mp3");
        POR_CLADO.put("ankylosauria", "encouracado.mp3");
        POR_CLADO.put("ankylosaurs not classified", "encouracado.mp3");
        POR_CLADO.put("stegosauria", "stegosauria.mp3");
        POR_CLADO.put("thyreophora", "thyreophora.mp3");

        POR_CLADO.put("ornithopoda", "ornithopoda.mp3");
        POR_CLADO.put("ankylopollexia", "ankylopollexia.mp3");
        POR_CLADO.put("rhabdodontomorpha", "rhabdodontomorpha.mp3");
        POR_CLADO.put("neornithischia", "ornitisquio.mp3");
        POR_CLADO.put("heterodontosauridae", "ornitisquio.mp3");
        POR_CLADO.put("ornithischia", "ornitisquio.mp3");
        POR_CLADO.put("ornithischia basais", "ornitisquio.mp3");

        // --- Theropoda ---
        POR_CLADO.put("coeluroides", "coeluroides.mp3");
        POR_CLADO.put("coelophysoidea", "coelophysoidea.mp3");
        POR_CLADO.put("abelisauridae", "abelisauridae.mp3");
        POR_CLADO.put("noasauridae", "noasauridae.mp3");
        POR_CLADO.put("neoceratosauria", "neoceratosauria.mp3");
        POR_CLADO.put("abelisauroidea", "abelisauroidea.mp3");
        POR_CLADO.put("ceratosauria", "teropode.mp3");
        POR_CLADO.put("spinosauridae", "spinosauridae.mp3");
        POR_CLADO.put("megalosauridae", "megalosauridae.mp3");
        POR_CLADO.put("piatnitzkysauridae", "piatnizkysauridae.mp3");
        POR_CLADO.put("megalosauroidea", "megalosauroidea.mp3");
        POR_CLADO.put("allosauridae", "allosauridae.mp3");
        POR_CLADO.put("carcharodontosauridae", "carcharodontosauridae.mp3");
        POR_CLADO.put("metriacanthosauridae", "metriacanthosauridae.mp3");
        POR_CLADO.put("neovenatoridae", "neovenatoridae.mp3");
        POR_CLADO.put("allosauroidea", "allosauroidea.mp3");
        POR_CLADO.put("tetanurae", "tetanurae.mp3");
        POR_CLADO.put("compsognathidae", "compsognathidae.mp3");
        POR_CLADO.put("alvarezsauridae", "alvarezsauridae.mp3");
        POR_CLADO.put("scansoriopterygidae", "scansoriopterygidae.mp3");
        POR_CLADO.put("therizinosauria", "therizinosauria.mp3");
        POR_CLADO.put("ornithomimidae", "ornithomimidae.mp3");
        POR_CLADO.put("deinocheiridae", "deinocheiridae.mp3");
        POR_CLADO.put("ornithomimosauria", "ornithomimosauria.mp3");
        POR_CLADO.put("oviraptoridae", "oviraptoridae.mp3");
        POR_CLADO.put("caenagnathidae", "caenagnathidae.mp3");
        POR_CLADO.put("caudipteridae", "caudipteridae.mp3");
        POR_CLADO.put("oviraptorosauria", "oviraptorosauria.mp3");
        POR_CLADO.put("dromaeosauridae", "dromaeosauridae.mp3");
        POR_CLADO.put("troodontidae", "troodontidae.mp3");
        POR_CLADO.put("anchiornithidae", "anchiornithidae.mp3");
        POR_CLADO.put("paraves", "paraves.mp3");
        POR_CLADO.put("maniraptoriformes", "maniraptoriformes.mp3");
        POR_CLADO.put("tyrannosauridae", "tyrannosauridae.mp3");
        POR_CLADO.put("proceratosauridae", "proceratosauridae.mp3");
        POR_CLADO.put("megaraptora", "megaraptora.mp3");
        POR_CLADO.put("eutyrannosauria", "eutyrannosauria.mp3");
        POR_CLADO.put("tyrannosauroidea", "tyrannosauroidea.mp3");
        POR_CLADO.put("coelurosauria", "coelurosauria.mp3");
        POR_CLADO.put("neotheropoda", "neotheropoda.mp3");
        POR_CLADO.put("theropoda", "theropoda.mp3");

        // --- Sauropodomorpha ---
        POR_CLADO.put("sauropods not in a larger group", "sauropodsNotInALargeGroup.mp3");
        POR_CLADO.put("mamenchisauridae", "mamenchisauridae.mp3");
        POR_CLADO.put("diplodocidae", "diplodocidae.mp3");
        POR_CLADO.put("rebbachisauridae", "rebbachisauridae.mp3");
        POR_CLADO.put("dicraeosauridae", "dicraeosauridae.mp3");
        POR_CLADO.put("macronaria", "macronia.mp3");
        POR_CLADO.put("brachiosauridae", "brachiosauridae.mp3");
        POR_CLADO.put("camarasauridae", "camarasauridae.mp3");
        POR_CLADO.put("somphospondyli", "somphospondyli.mp3");
        POR_CLADO.put("titanosauria", "titanosauria.mp3");
        POR_CLADO.put("saltasauridae", "saltasauridae.mp3");
        POR_CLADO.put("sauropodomorpha", "sauropodomorpha.mp3");
        POR_CLADO.put("sauropoda", "sauropode.mp3");

        // --- Stem / saurischia basal ---
        POR_CLADO.put("early saurischians", "earlySaurischians.mp3");
        POR_CLADO.put("silesauridae", "pequeno.mp3");
        POR_CLADO.put("early dinosauromorphs", "pequeno.mp3");
    }

    private SomPorClado() {
    }

    public static SomVocal inferir(Taxon taxon, Map<Long, Taxon> porId) {
        if (taxon == null) {
            return null;
        }
        Taxon atual = taxon;
        int guard = 0;
        while (atual != null && guard < 64) {
            String arquivo = POR_CLADO.get(chave(atual.getNome()));
            if (arquivoValido(arquivo)) {
                return SomVocal.perfil(arquivo);
            }
            Long parentId = atual.getParentId();
            atual = parentId == null ? null : porId.get(parentId);
            guard++;
        }
        return null;
    }

    public static boolean arquivoValido(String arquivo) {
        return arquivo != null && ARQUIVO_OK.matcher(arquivo).matches();
    }

    private static String chave(String nome) {
        return nome == null ? "" : nome.trim().toLowerCase(Locale.ROOT);
    }
}
