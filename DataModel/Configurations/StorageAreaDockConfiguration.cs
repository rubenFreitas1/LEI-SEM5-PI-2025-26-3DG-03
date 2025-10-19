namespace DataModel.Configurations;

using DataModel.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class StorageAreaDockConfiguration : IEntityTypeConfiguration<StorageAreaDockDataModel>
{
    public void Configure(EntityTypeBuilder<StorageAreaDockDataModel> builder)
    {
        // 🔑 Chave composta
        builder.HasKey(sad => new { sad.StorageAreaId, sad.DockId });

        builder.Property(sad => sad.Distance)
               .IsRequired();

        builder.HasOne(sad => sad.StorageArea)
               .WithMany(sa => sa.StorageAreaDocks)
               .HasForeignKey(sad => sad.StorageAreaId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(sad => sad.Dock)
       .WithMany() 
       .HasForeignKey(sad => sad.DockId)
       .OnDelete(DeleteBehavior.Cascade);

        builder.ToTable("StorageAreaDock");
    }
}
