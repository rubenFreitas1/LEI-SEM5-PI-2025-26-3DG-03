namespace DataModel.Repository;

using DataModel.Model;
using Microsoft.EntityFrameworkCore;
using DataModel.Configurations;
using Microsoft.Extensions.Configuration;

public class ShippingManagementContext : DbContext
{
    protected readonly IConfiguration? Configuration;

    //public AbsanteeContext() {}
    public ShippingManagementContext(DbContextOptions<ShippingManagementContext> options)
        : base(options)
    {
    }

    public virtual DbSet<VesselTypeDataModel> VesselTypes { get; set; } = null!;
    public virtual DbSet<QualificationDataModel> Qualifications { get; set; } = null!;
    public virtual DbSet<DockDataModel> Docks { get; set; } = null!;
    public virtual DbSet<StorageAreaDataModel> StorageAreas { get; set; } = null!;
    public virtual DbSet<StorageAreaDockDataModel> StorageAreaDocks { get; set; } = null!;
    public virtual DbSet<VesselRecordDataModel> VesselRecords { get; set; } = null!;
    public virtual DbSet<StaffDataModel> Staffs { get; set; } = null!;
    public virtual DbSet<ShippingAgentOrganizationDataModel> ShippingAgentOrganizations { get; set; } = null!;
    public virtual DbSet<RepresentativeDataModel> Representatives { get; set; } = null!;
    public virtual DbSet<VesselVisitNotificationDataModel> VesselVisitNotifications { get; set; } = null!;
    public virtual DbSet<CargoManifestDataModel> CargoManifests { get; set; } = null!;
    public virtual DbSet<CargoManifestEntryDataModel> CargoManifestEntries { get; set; } = null!;
    public virtual DbSet<CrewMemberDataModel> CrewMembers { get; set; } = null!;
    public virtual DbSet<PhysicalResourceDataModel> PhysicalResources { get; set; } = null!;
    public virtual DbSet<DecisionDataModel> Decisions { get; set; } = null!;
    public virtual DbSet<DataRequestDataModel> DataRequests { get; set; } = null!;

    public virtual DbSet<SystemUserDataModel> SystemUsers { get; set; } = null!;
    public virtual DbSet<PrivacyPolicyDataModel> PrivacyPolicies { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new VesselTypeConfiguration());
        modelBuilder.ApplyConfiguration(new DockConfiguration());
        modelBuilder.ApplyConfiguration(new StaffConfiguration());
        modelBuilder.ApplyConfiguration(new PhysicalResourceConfiguration());
        modelBuilder.ApplyConfiguration(new VesselRecordConfiguration());
        modelBuilder.ApplyConfiguration(new StorageAreaConfiguration());
        modelBuilder.ApplyConfiguration(new StorageAreaDockConfiguration());
        modelBuilder.ApplyConfiguration(new ShippingAgentOrganizationConfiguration());
        modelBuilder.ApplyConfiguration(new RepresentativeConfiguration());
        modelBuilder.ApplyConfiguration(new VesselVisitNotificationConfiguration());
        modelBuilder.ApplyConfiguration(new CargoManifestConfiguration());
        modelBuilder.ApplyConfiguration(new CargoManifestEntryConfiguration());
        modelBuilder.ApplyConfiguration(new CrewMemberConfiguration());
        modelBuilder.ApplyConfiguration(new DecisionConfiguration());
        modelBuilder.ApplyConfiguration(new SystemUserConfiguration());
        modelBuilder.ApplyConfiguration(new PrivacyPolicyConfiguration());
        modelBuilder.ApplyConfiguration(new DataRequestConfiguration());

        // necessário se Domain.Model.Colaborator fosse usado para persistência, e se pretendesse que os atributos/propriedades fossem privadas

        // var property = typeof(Colaborator).GetProperty("Name", BindingFlags.NonPublic | BindingFlags.Instance);
        // if (property != null)
        // 	modelBuilder.Entity<Colaborator>()
        // 		.Property("_strName")
        // 		.HasColumnName("Name");

        // modelBuilder.Entity<Colaborator>()
        // 	.HasKey(c => c.Id);

        // modelBuilder.Entity<Colaborator>()
        // 	.HasKey(c => c.Email);

    }
}