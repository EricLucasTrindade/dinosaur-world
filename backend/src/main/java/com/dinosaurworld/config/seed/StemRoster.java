package com.dinosaurworld.config.seed;

import static com.dinosaurworld.config.seed.Nodes.clade;
import static com.dinosaurworld.config.seed.Nodes.family;
import static com.dinosaurworld.config.seed.Nodes.genus;
import static com.dinosaurworld.config.seed.Nodes.sp;

/**
 * Dinosauromorfos basais e Silesauridae (páginas 1–2 do PDF).
 * Esses grupos não tinham marca Old/New; entram como roster vigente.
 */
final class StemRoster {

    private StemRoster() {
    }

    static SeedNode earlyDinosauromorphs() {
        return clade("Early Dinosauromorphs",
                genus("Dromomeron",
                        sp("D. gigas"),
                        sp("D. gregorii"),
                        sp("D. romeri")),
                genus("Ixalerpeton", sp("I. polesinensis")),
                genus("Kongonaphon", sp("K. kely")),
                genus("Lagerpeton", sp("L. chanarensis")),
                genus("Lagosuchus", sp("L. talampayensis")),
                genus("Marasuchus", sp("M. lilloensis")),
                genus("Scleromochlus", sp("S. taylori")),
                genus("Thecospondylus", sp("T. hornei")),
                genus("Venetoraptor", sp("V. gassenae")));
    }

    static SeedNode silesauridae() {
        return family("Silesauridae",
                genus("Agnosphitys", sp("A. cromhallensis")),
                genus("Amanasaurus", sp("A. nesbitti")),
                genus("Asilisaurus", sp("A. kongwe")),
                genus("Diodorus", sp("D. scytobrachion")),
                genus("Eucoelophysis", sp("E. baldwini")),
                genus("Gamatavus", sp("G. antiquus")),
                genus("Gondwanax", sp("G. paraisensis")),
                genus("Ignotosaurus", sp("I. fragilis")),
                genus("Itaguyra", sp("I. occulta")),
                genus("Kwanasaurus", sp("K. williamparkeri")),
                genus("Lewisuchus", sp("L. admixtus")),
                genus("Lutungutali", sp("L. sitwensis")),
                genus("Pisanosaurus", sp("P. mertii")),
                genus("Sacisaurus", sp("S. agudoensis")),
                genus("Silesaurus", sp("S. opolensis")),
                genus("Soumyasaurus", sp("S. aenigmaticus")),
                genus("Technosaurus", sp("T. smalli")));
    }
}
