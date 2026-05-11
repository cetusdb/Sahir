namespace SahirAPI.DTOs;

/// <summary>Soğuk başlangıç (geçmişi olmayan kullanıcı) için tercih bilgisi.</summary>
public record AIPreferencesDto(
    List<string>? Genres,    // ["Aksiyon", "Bilim Kurgu"]
    string? Mood,            // "Eğlenceli" / "Düşündürücü" / "Gerilim" / "Romantik" / "Sakin"
    string? Era              // "Yeni" / "Klasik" / "Eski" / "Farketmez"
);

/// <summary>AI önerilerinin sonucu — film listesi + kısa bir gerekçe metni.</summary>
public record AIRecommendationResultDto(
    IEnumerable<ProductionListItemDto> Items,
    string? Reason,
    bool ColdStart);
