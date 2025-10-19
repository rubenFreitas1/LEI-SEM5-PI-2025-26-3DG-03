namespace DataModel.Configurations;

using DataModel.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class StorageAreaConfiguration : IEntityTypeConfiguration<StorageAreaDataModel>
{
    public void Configure(EntityTypeBuilder<StorageAreaDataModel> builder)
    {
        builder.HasKey(sa => sa.Id);

        builder.HasIndex(sa => sa.Code)
            .IsUnique();

        builder.HasIndex(sa => sa.Location)
            .IsUnique();

        builder.Property(sa => sa.LastModifiedAt).IsRequired();

        builder.HasMany(sa => sa.StorageAreaDocks)
            .WithOne(sad => sad.StorageArea!)
            .HasForeignKey(sad => sad.StorageAreaId);
    }

}