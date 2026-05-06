using FoodMapServer.Models;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace FoodMapServer.Services;

public class RestaurantService
{
    // IMongoCollection 是 MongoDB 驅動程式提供的工具，用來操作特定的資料表
    private readonly IMongoCollection<Restaurant> _restaurantsCollection;

    // 構造函數：當程式啟動時，會自動把設定檔裡的連線資訊傳進來
    public RestaurantService(IOptions<FoodMapDatabaseSettings> settings)
    {
        var mongoClient = new MongoClient(settings.Value.ConnectionString);
        var mongoDatabase = mongoClient.GetDatabase(settings.Value.DatabaseName);

        // 指定我們要操作的是哪個 Collection (資料表)
        _restaurantsCollection = mongoDatabase.GetCollection<Restaurant>(
            settings.Value.RestaurantsCollectionName);
    }

    // 取得所有餐廳的動作
    public async Task<List<Restaurant>> GetAsync() =>
        await _restaurantsCollection.Find(_ => true).ToListAsync();

    // 批次新增餐廳的動作 (用於匯入你的 JSON)
    public async Task CreateBatchAsync(List<Restaurant> newRestaurants) =>
        await _restaurantsCollection.InsertManyAsync(newRestaurants);
}