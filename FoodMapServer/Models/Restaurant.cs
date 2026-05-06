using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace FoodMapServer.Models;


public class ReferrerInfo
{
    //referrer name
    [BsonElement("name")]
    public string Name { get; set; } = null!;

    //email
    [BsonElement("email")]
    public string Email { get; set; } = null!;
}
[BsonIgnoreExtraElements]
public class Restaurant
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [BsonIgnoreIfDefault]
    public string? Id { get; set; }

    [BsonElement("name")]
    public string Name { get; set; } = null!;

    [BsonElement("type")]
    public string Type { get; set; } = null!;

    // --- 練習開始：請試著補齊以下欄位 ---
    
    // 1. 緯度 (Latitude) 與 經度 (Longitude) - 提示：型別可以用 double
    [BsonElement("coordinates")]
    public List<double> Coordinates { get; set; } = new List<double>();

    
    // 2. 價格範圍 (PriceRange) - 提示：型別 string
    [BsonElement("priceRange")]
    public string PriceRange { get; set; } = null!;
    
    // 3. 推薦菜色 (RecommendedDishes) - 提示：因為有很多道菜，建議用 List<string>
    [BsonElement("recommendedDishes")]
    public List <string> RecommendedDishes { get; set; } = null!;
    
    // 4. Tags: List<string>
    [BsonElement("tags")]
    public List <string> Tags { get; set; } = null!;
    // 5. 狀態 (Status) - 提示：string，預設值可以是 "pending"
    [BsonElement("status")]
    public string Status { get; set; } = "pending";
    // 6. 還有其他的：Summary, Description, GoogleMapsLink, PhotoUrl...
    //Summary
    [BsonElement("summary")]
    public string Summary { get; set; } = null!;

    //Description
    [BsonElement("description")]
    public string Description { get; set; } = null!;

    //googleMapsLink
    [BsonElement("googleMapsLink")]
    public string GoogleMapsLink { get; set; } = null!;

    //photoUrl
    [BsonElement("photoUrl")]
    public string PhotoUrl { get; set; } = null!;

    [BsonElement("notionLink")]
    public string NotionLink { get; set; } = null!;

    //referrer: {name: ,email:}
    [BsonElement("referrer")]
    public ReferrerInfo Referrer { get; set; } = null!;

    [BsonElement("area")]
    public string Area { get; set; } = null!;

}

