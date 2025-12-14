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
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Domain.Model;
var builder = WebApplication.CreateBuilder(args);

// Authentication + Authorization
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

    options.Events = new JwtBearerEvents
    {
        OnTokenValidated = async context =>
        {
            var httpContext = context.HttpContext;

            var email =
                context.Principal!.FindFirst("https://lapr5/email")?.Value ??
                context.Principal.FindFirst("email")?.Value;

            if (email == null)
                return;

            var userService = httpContext.RequestServices.GetRequiredService<SystemUserService>();
            var user = await userService.GetSystemUserByEmail(email);
            var identity = context.Principal.Identity as ClaimsIdentity;
            if (user != null)
            {
                if (user.Status.Equals("Deactivated"))
                {
                    context.Fail("User deactivated");
                    return;
                }

                identity!.AddClaim(new Claim(ClaimTypes.Role, user.Role.ToString()));
                return;
            }

            var rep = await userService.GetRepresentativeByEmail(email);

            if (rep != null)
            {
                identity!.AddClaim(new Claim(ClaimTypes.Role, "Representative"));
                return;
            }
            context.Fail("User not registered in system.");
        }
    };
});

builder.Services.AddAuthorization();

builder.Services.AddControllers()
    .AddJsonOptions(o =>
        o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<ShippingManagementContext>(opt =>
    opt.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString))
);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigin", policy =>
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
builder.Services.AddTransient<DockReassignmentLogMapper>();

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
builder.Services.AddTransient<IEmailService, EmailService>();

builder.Services.AddTransient<IPrivacyPolicyRepository, PrivacyPolicyRepository>();
builder.Services.AddTransient<IPrivacyPolicyFactory, PrivacyPolicyFactory>();
builder.Services.AddTransient<PrivacyPolicyMapper>();
builder.Services.AddTransient<PrivacyPolicyService>();

builder.Services.AddTransient<IDataRequestRepository, DataRequestRepository>();
builder.Services.AddTransient<IDataRequestFactory, DataRequestFactory>();
builder.Services.AddTransient<DataRequestMapper>();
builder.Services.AddTransient<DataRequestService>();

builder.WebHost.UseUrls("http://0.0.0.0:5000");

var app = builder.Build();


// ------------------ PRODUCTION ------------------
if (app.Environment.IsProduction())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<ShippingManagementContext>();

    // Step 1: run migrations
    db.Database.Migrate();

    // Step 2: seed if empty
    if (!db.SystemUsers.Any())
    {
        Utilities.InitializeDatabase(app);
    }
}


// ------------------ DEVELOPMENT ------------------
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<ShippingManagementContext>();

    db.Database.Migrate();

    if (!db.SystemUsers.Any())
    {
        Utilities.InitializeDatabase(app);
    }
}


// Pipeline
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowSpecificOrigin");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

public partial class Program { }