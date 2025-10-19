using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;

using Application.Services;
using DataModel.Repository;
using DataModel.Mapper;
using Domain.Factory;
using Domain.IRepository;
using WebApi.Helpers;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddDbContext<ShippingManagementContext>(opt =>
    opt.UseInMemoryDatabase("ShippingManagementDatabase")
    //opt.UseSqlite("Data Source=ShippingManagementDatabase.sqlite")
    //opt.UseSqlite(Host.CreateApplicationBuilder().Configuration.GetConnectionString("ShippingManagementDatabase"))
    );

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();




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

var app = builder.Build();

Utilities.InitializeDbForApp(app);


// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();

public partial class Program { }