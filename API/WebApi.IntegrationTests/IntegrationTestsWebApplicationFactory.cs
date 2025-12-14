using System.Data.Common;
using DataModel.Repository;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using WebApi.IntegrationTests.Helpers;

namespace WebApi.IntegrationTests;

public class IntegrationTestsWebApplicationFactory<Program>
    : WebApplicationFactory<Program> where Program : class
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            //
            // 1 — Remove MySQL DbContext configuration
            //
            var dbContextDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<ShippingManagementContext>)
            );
            if (dbContextDescriptor != null)
                services.Remove(dbContextDescriptor);

            //
            // 2 — Remove any existing DbConnection
            //
            var connDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbConnection)
            );
            if (connDescriptor != null)
                services.Remove(connDescriptor);

            //
            // 3 — Add a shared SQLite in-memory connection (must stay open!)
            //
            services.AddSingleton<DbConnection>(_ =>
            {
                var connection = new SqliteConnection("DataSource=:memory:");
                connection.Open();
                return connection;
            });

            //
            // 4 — Register DbContext using SQLite
            //
            services.AddDbContext<ShippingManagementContext>((provider, options) =>
            {
                var conn = provider.GetRequiredService<DbConnection>();
                options.UseSqlite(conn);
                options.UseLoggerFactory(LoggerFactory.Create(builder => builder.SetMinimumLevel(LogLevel.None)));
                options.EnableSensitiveDataLogging(false);
            });

            //
            // 5 — Add test authentication (bypass JWT)
            //
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = "Test";
                options.DefaultChallengeScheme = "Test";
            })
            .AddScheme<
                Microsoft.AspNetCore.Authentication.AuthenticationSchemeOptions,
                TestAuthHandler
            >("Test", _ => { });


            //
            // 6 — Build provider so we can initialize DB
            //
            var sp = services.BuildServiceProvider();

            using (var scope = sp.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ShippingManagementContext>();

                //
                // 7 — Create schema via EnsureCreated (NOT migrations!)
                //
                db.Database.EnsureDeleted();
                db.Database.EnsureCreated();

                //
                // 8 — Seed the test database
                //
                Utilities.InitializeDbForTests(db);
            }
        });

        //
        // 9 — Minimize logging noise
        //
        builder.ConfigureLogging(logging =>
        {
            logging.ClearProviders();
            logging.AddConsole();
            logging.SetMinimumLevel(LogLevel.Critical);
            logging.AddFilter("Microsoft", LogLevel.None);
            logging.AddFilter("Microsoft.EntityFrameworkCore", LogLevel.None);
            logging.AddFilter("Microsoft.EntityFrameworkCore.Database.Command", LogLevel.None);
        });
    }
}
