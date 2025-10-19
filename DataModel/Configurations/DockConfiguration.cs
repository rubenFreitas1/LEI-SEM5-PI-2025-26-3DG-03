using Microsoft.EntityFrameworkCore;

namespace DataModel.Configurations;

using DataModel.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;


public class DockConfiguration : IEntityTypeConfiguration<DockDataModel>
{

    public void Configure(EntityTypeBuilder<DockDataModel> builder)
    {
        builder.HasKey(d => d.Id);

         builder.HasIndex(d => d.Name).IsUnique();

        builder.HasIndex(d => d.Location)
            .IsUnique();

        builder.HasMany(d => d.VesselTypesAllowed)
            .WithMany().UsingEntity(j => j.ToTable("DockVesselTypeAllowed"));

        builder.Property(d => d.LastModifiedAt).IsRequired();
    }

}