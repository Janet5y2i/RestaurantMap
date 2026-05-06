using FoodMapServer.Models;
using FoodMapServer.Services;
using System.Text.Json;
//using dotenv.net; // 記得引用這個命名空間
using MongoDB.Driver;
var builder = WebApplication.CreateBuilder(args);


//DotEnv.Load();
// get the MongoDB connection string from environment variable
var connectionString = Environment.GetEnvironmentVariable("MONGODB_CONNECTION_STRING");

if (string.IsNullOrEmpty(connectionString) || connectionString.Contains("FoodMapDatabase"))
{
    throw new Exception("錯誤：未設定資料庫連線字串。請檢查環境變數。");
}

builder.Configuration["FoodMapDatabase:ConnectionString"] = connectionString;

// 註冊 MongoDB 客戶端
builder.Services.AddSingleton<IMongoClient>(new MongoClient(connectionString));

// 1. 註冊資料庫設定與服務
builder.Services.Configure<FoodMapDatabaseSettings>(
    builder.Configuration.GetSection("FoodMapDatabase"));

builder.Services.AddSingleton<RestaurantService>();

builder.Services.AddOpenApi();
builder.Services.AddCors(option =>
{
    option.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
                .AllowAnyHeader()
                .AllowAnyMethod();
    });
});

var app = builder.Build();

/*
//one time data import 
// 2. [可選] 一次性匯入資料的邏輯
// 當你確認資料庫已經有資料後，可以把這段註解掉
var currentDirectory = Directory.GetCurrentDirectory();
using (var scope = app.Services.CreateScope())
{
    var service = scope.ServiceProvider.GetRequiredService<RestaurantService>();
    var existingData = await service.GetAsync();
    
    if (existingData.Count == 0)
    {
        try 
        {
            var jsonPath = "../preprocess/restaurants.json";
            
            if (File.Exists(jsonPath))
            {
                // **關鍵修正：要把檔案讀成字串**
                string jsonString = File.ReadAllText(jsonPath); 

                var restaurants = JsonSerializer.Deserialize<List<Restaurant>>(jsonString, new JsonSerializerOptions 
                { 
                    PropertyNameCaseInsensitive = true 
                });

                if (restaurants != null)
                {
                    await service.CreateBatchAsync(restaurants);
                    Console.WriteLine("成功匯入餐廳資料！");
                }
            }
            else
            {
                Console.WriteLine($"警告：找不到 JSON 檔案，路徑為：{jsonPath}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"匯入過程中發生錯誤: {ex.Message}");
        }
    }
    else
    {
        Console.WriteLine($"資料庫已有 {existingData.Count} 筆資料，跳過匯入。");
    }
}


*/


// 3. 設定 HTTP 管道
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

//app.UseHttpsRedirection();
app.UseCors();


// 4. 定義 API：取得所有餐廳資料
app.MapGet("/api/restaurants", async (RestaurantService service) =>
{
    return await service.GetAsync();
})
.WithName("GetRestaurants");

app.Run();