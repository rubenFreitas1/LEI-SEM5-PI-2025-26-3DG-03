using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;

using Application.Services;
using DataModel.Repository;
using DataModel.Mapper;
using Domain.Factory;
using Domain.IRepository;
using WebApi.Helpers;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authentication.JwtBearer;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.Authority = $"https://{builder.Configuration["Auth0:Domain"]}/";
    options.Audience = builder.Configuration["Auth0:Audience"];

    options.TokenValidationParameters = new TokenValidationParameters
    {
        NameClaimType = "email"
    };
});

builder.Services.AddAuthorization();


builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<ShippingManagementContext>(opt =>
     //opt.UseInMemoryDatabase("ShippingManagementDatabase")
     //opt.UseSqlite("Data Source=ShippingManagementDatabase.sqlite")
     //opt.UseSqlite(Host.CreateApplicationBuilder().Configuration.GetConnectionString("ShippingManagementDatabase"))
     opt.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString))
    );


builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();


builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigin",
        policy =>
        {
            policy.WithOrigins(
                "http://localhost:4200",
                "http://141.253.198.138"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()
            .WithExposedHeaders("Authorization");
        });
});


builder.Services.AddTransient<IVesselTypeRepository, VesselTypeRepository>();
builder.Services.AddTransient<IVesselTypeFactory, VesselTypeFactory>();
builder.Services.AddTransient<VesselTypeMapper>();
builder.Services.AddTransient<VesselTypeService>();

builder.Services.AddTransient<IVesselRecordRepository, VesselRecordRepository>();
builder.Services.AddTransient<IVesselRecordFactory, VesselRecordFactory>();
builder.Services.AddTransient<VesselRecordMapper>();
builder.Services.AddTransient<VesselRecordService>();

builder.Services.AddTransient<IQualificationRepository, QualificationRepository>();
builder.Services.AddTransient<IQualificationFactory, QualificationFactory>();
builder.Services.AddTransient<QualificationMapper>();
builder.Services.AddTransient<QualificationService>();

builder.Services.AddTransient<IDockRepository, DockRepository>();
builder.Services.AddTransient<IDockFactory, DockFactory>();
builder.Services.AddTransient<DockMapper>();
builder.Services.AddTransient<DockService>();

builder.Services.AddTransient<IStaffRepository, StaffRepository>();
builder.Services.AddTransient<IStaffFactory, StaffFactory>();
builder.Services.AddTransient<StaffMapper>();
builder.Services.AddTransient<StaffService>();

builder.Services.AddTransient<IStorageAreaRepository, StorageAreaRepository>();
builder.Services.AddTransient<IStorageAreaFactory, StorageAreaFactory>();
builder.Services.AddTransient<StorageAreaMapper>();
builder.Services.AddTransient<StorageAreaService>();

builder.Services.AddTransient<IShippingAgentOrganizationRepository, ShippingAgentOrganizationRepository>();
builder.Services.AddTransient<IShippingAgentOrganizationFactory, ShippingAgentOrganizationFactory>();
builder.Services.AddTransient<ShippingAgentOrganizationMapper>();
builder.Services.AddTransient<ShippingAgentOrganizationService>();

builder.Services.AddTransient<IRepresentativeRepository, RepresentativeRepository>();
builder.Services.AddTransient<IRepresentativeFactory, RepresentativeFactory>();
builder.Services.AddTransient<RepresentativeMapper>();
builder.Services.AddTransient<RepresentativeService>();

builder.Services.AddTransient<IVesselVisitNotificationRepository, VesselVisitNotificationRepository>();
builder.Services.AddTransient<IVesselVisitNotificationFactory, VesselVisitNotificationFactory>();
builder.Services.AddTransient<VesselVisitNotificationMapper>();
builder.Services.AddTransient<IDecisionRepository, DecisionRepository>();
builder.Services.AddTransient<IDecisionFactory, DecisionFactory>();
builder.Services.AddTransient<DecisionMapper>();
builder.Services.AddTransient<VesselVisitNotificationService>();

builder.Services.AddTransient<IPhysicalResourceRepository, PhysicalResourceRepository>();
builder.Services.AddTransient<IPhysicalResourceFactory, PhysicalResourceFactory>();
builder.Services.AddTransient<PhysicalResourceMapper>();
builder.Services.AddTransient<PhysicalResourceService>();

builder.Services.AddTransient<SchedulingService>();

builder.Services.AddTransient<ISystemUserRepository, SystemUserRepository>();
builder.Services.AddTransient<ISystemUserFactory, SystemUserFactory>();
builder.Services.AddTransient<SystemUserMapper>();
builder.Services.AddTransient<SystemUserService>();



builder.WebHost.UseUrls("http://0.0.0.0:5000");


var app = builder.Build();

Utilities.InitializeDatabase(app);




app.UseSwagger();
app.UseSwaggerUI();


//app.UseHttpsRedirection();



app.UseCors("AllowSpecificOrigin");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

public partial class Program { }