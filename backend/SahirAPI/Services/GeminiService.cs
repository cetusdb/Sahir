using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace SahirAPI.Services;

public interface IGeminiService
{
    /// <summary>Gemini API'ye prompt gönderir, dönen metni geri verir.</summary>
    Task<string> GenerateAsync(string prompt, CancellationToken ct = default);
}

public class GeminiService : IGeminiService
{
    private readonly HttpClient _http;
    private readonly string _apiKey;
    private readonly string _model;

    public GeminiService(HttpClient http, IConfiguration config)
    {
        _http   = http;
        _apiKey = config["Gemini:ApiKey"]
                  ?? throw new InvalidOperationException("Gemini:ApiKey ayarlanmamış.");
        _model  = config["Gemini:Model"] ?? "gemini-1.5-flash";
    }

    public async Task<string> GenerateAsync(string prompt, CancellationToken ct = default)
    {
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent?key={_apiKey}";

        var body = new
        {
            contents = new[]
            {
                new { parts = new[] { new { text = prompt } } }
            },
            generationConfig = new
            {
                temperature       = 0.7,
                maxOutputTokens   = 8192,                     // 2048 → 8192 (cevabın kesilmemesi için)
                responseMimeType  = "application/json",
                thinkingConfig    = new { thinkingBudget = 0 } // 2.5-flash thinking modunu kapat
            }
        };

        var json    = JsonSerializer.Serialize(body);
        using var content = new StringContent(json, Encoding.UTF8, "application/json");

        using var resp = await _http.PostAsync(url, content, ct);
        var raw = await resp.Content.ReadAsStringAsync(ct);

        if (!resp.IsSuccessStatusCode)
            throw new HttpRequestException($"Gemini API hatası ({(int)resp.StatusCode}): {raw}");

        // Yanıttaki text alanını ayıkla
        using var doc = JsonDocument.Parse(raw);
        var text = doc.RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString();

        return text ?? "";
    }
}
