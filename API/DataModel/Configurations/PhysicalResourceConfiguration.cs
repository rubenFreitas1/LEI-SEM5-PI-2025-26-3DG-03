using DataModel.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DataModel.Configurations
{
    public class PhysicalResourceConfiguration : IEntityTypeConfiguration<PhysicalResourceDataModel>
    {
        public void Configure(EntityTypeBuilder<PhysicalResourceDataModel> builder)
        {
            builder.HasKey(p => p.Id);
            builder.Property(p => p.Code).IsRequired().HasMaxLength(20);
            builder.Property(p => p.Name).IsRequired().HasMaxLength(100);
            builder.Property(p => p.Description).IsRequired().HasMaxLength(250);
            builder.Property(p => p.OperationalCapacity).IsRequired();
            builder.Property(p => p.AssignedStorageAreaCode).HasMaxLength(50);
            builder.Property(p => p.AssignedDockName).HasMaxLength(50);
            builder.Property(p => p.StartDay).IsRequired();
            builder.Property(p => p.EndDay).IsRequired();
            builder.Property(p => p.StartTime).IsRequired();
            builder.Property(p => p.EndTime).IsRequired();
            builder.HasMany(p => p.QualificationRequirements)
                .WithMany()
                .UsingEntity(j => j.ToTable("PhysicalResourceQualifications"));
        }
    }
}
