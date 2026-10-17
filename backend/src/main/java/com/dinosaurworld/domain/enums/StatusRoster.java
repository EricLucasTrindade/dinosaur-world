package com.dinosaurworld.domain.enums;

/**
 * Marca do update de setembro/2026.
 * <ul>
 *   <li>OLD — já estava no roster e permanece neste clado</li>
 *   <li>NEW — entra neste clado neste update</li>
 *   <li>LEAVING — saiu do clado antigo; o pai atual é o destino</li>
 * </ul>
 */
public enum StatusRoster {
    OLD,
    NEW,
    LEAVING
}
