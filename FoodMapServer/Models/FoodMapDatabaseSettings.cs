namespace FoodMapServer.Models;

public class FoodMapDatabaseSettings
{
    // 這些名稱必須跟你 appsettings.json 裡的 Key 完全一致
    public string ConnectionString { get; set; } = null!;
    public string DatabaseName { get; set; } = null!;
    public string RestaurantsCollectionName { get; set; } = null!;
}