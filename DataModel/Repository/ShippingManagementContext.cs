namespace DataModel.Repository;

using DataModel.Model;
using Microsoft.EntityFrameworkCore;

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

	//public virtual DbSet<ColaboratorDataModel> Colaborators { get; set; } = null!;
	//public virtual DbSet<AddressDataModel> Address { get; set; } = null!;


	protected override void OnModelCreating(ModelBuilder modelBuilder)
	{

		// necessÃ¡rio se Domain.Model.Colaborator fosse usado para persistÃªncia, e se pretendesse que os atributos/propriedades fossem privadas

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