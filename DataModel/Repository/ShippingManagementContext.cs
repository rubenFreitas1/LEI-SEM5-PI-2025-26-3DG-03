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
        Database.EnsureCreated();
    }

    public virtual DbSet<VesselTypeDataModel> VesselTypes { get; set; } = null!;
    public virtual DbSet<QualificationDataModel> Qualifications { get; set; } = null!;
    public virtual DbSet<DockDataModel> Docks { get; set; } = null!;

    public virtual DbSet<VesselRecordDataModel> VesselRecords { get; set; } = null!;
    public virtual DbSet<StaffDataModel> Staffs { get; set; } = null!;


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new VesselTypeConfiguration());
        modelBuilder.ApplyConfiguration(new DockConfiguration());
        modelBuilder.ApplyConfiguration(new StaffConfiguration());
        modelBuilder.ApplyConfiguration(new VesselRecordConfiguration());

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