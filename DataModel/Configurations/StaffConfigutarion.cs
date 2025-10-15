using Microsoft.EntityFrameworkCore;

namespace DataModel.Configurations;

using DataModel.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class StaffConfiguration : IEntityTypeConfiguration<StaffDataModel>
{

    public void Configure(EntityTypeBuilder<StaffDataModel> builder)
    {
        builder.HasKey(s => s.Id);

        builder.HasIndex(s => s.Email)
            .IsUnique();

        builder.HasIndex(s => s.Phone)
            .IsUnique();

        builder.HasMany<QualificationDataModel>(s => s.Qualification)
            .WithMany().UsingEntity(j => j.ToTable("StaffQualification"));
    }

}