package com.dinosaurworld.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.dinosaurworld.domain.enums.Catalogo;
import com.dinosaurworld.domain.enums.Dieta;
import com.dinosaurworld.domain.enums.StatusRoster;
import com.dinosaurworld.domain.enums.TipoTaxon;

/**
 * Nó da árvore taxonômica. Lista de adjacência: um registro, um pai.
 * Um gênero não pode existir em dois clados — a unique (parent_id, nome) e
 * a regra de mover no serviço garantem isso.
 */
@Entity
@Table(
        name = "taxon",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_taxon_pai_nome",
                columnNames = {"parent_id", "nome"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Taxon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, length = 120)
    private String nome;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoTaxon tipo;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private StatusRoster status;

    /**
     * Separa o roster de dinossauros dos catálogos de répteis.
     * Nulo só até a carga marcar os registros antigos.
     */
    @Enumerated(EnumType.STRING)
    @Column(length = 32)
    private Catalogo catalogo;

    /**
     * Preenchido só em LEAVING: clado de origem no PDF
     * (ex.: "Saltasauridae" quando o gênero foi para Titanosauria).
     */
    @Column(name = "origem_clado", length = 120)
    private String origemClado;

    /** Ordem entre irmãos, para preservar a sequência do documento. */
    @Column(nullable = false)
    private int ordem;

    /**
     * Só em GENUS/SPECIES. Preenchido pelo enriquecimento (clado + overrides),
     * não pelo seed da árvore.
     */
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Dieta dieta;

    /** ISO 3166-1 alpha-2 do país da localidade-tipo / descoberta. */
    @Column(name = "pais_codigo", length = 2)
    private String paisCodigo;

    @Column(name = "pais_nome", length = 80)
    private String paisNome;

    /**
     * Nome do MP3 em /audio/dinos/. Preenchido pelo enriquecimento
     * (perfil do clado ou CSV), não pelo seed da árvore.
     */
    @Column(name = "som_arquivo", length = 40)
    private String somArquivo;

    /** Aviso curto: reconstrução especulativa, sem gravação real. */
    @Column(name = "som_nota", length = 180)
    private String somNota;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Taxon parent;

    /** FK sem inicializar o proxy — usado para montar a árvore em memória. */
    public Long getParentId() {
        return parent == null ? null : parent.getId();
    }
}
