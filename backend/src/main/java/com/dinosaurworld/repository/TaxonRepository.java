package com.dinosaurworld.repository;

import com.dinosaurworld.domain.Taxon;
import com.dinosaurworld.domain.enums.Catalogo;
import com.dinosaurworld.domain.enums.StatusRoster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TaxonRepository extends JpaRepository<Taxon, Long> {

    List<Taxon> findByStatusOrderByNomeAsc(StatusRoster status);

    List<Taxon> findAllByOrderByOrdemAscNomeAsc();

    List<Taxon> findByCatalogoOrderByOrdemAscNomeAsc(Catalogo catalogo);

    boolean existsByCatalogoAndParentIsNullAndNomeIgnoreCase(Catalogo catalogo, String nome);

    @Modifying(clearAutomatically = true)
    @Query("update Taxon t set t.catalogo = :catalogo where t.catalogo is null")
    int preencherCatalogoNulo(@Param("catalogo") Catalogo catalogo);

    boolean existsByParent_IdAndNomeIgnoreCase(Long parentId, String nome);

    boolean existsByParentIsNullAndNomeIgnoreCase(String nome);

    @Query("select coalesce(max(t.ordem), -1) from Taxon t where t.parent.id = :parentId")
    int maxOrdemPorPai(Long parentId);

    @Query("select coalesce(max(t.ordem), -1) from Taxon t where t.parent is null")
    int maxOrdemRaiz();

    Optional<Taxon> findByParent_IdAndNomeIgnoreCase(Long parentId, String nome);

    Optional<Taxon> findByParentIsNullAndNomeIgnoreCase(String nome);

    long countByParent_Id(Long parentId);
}
