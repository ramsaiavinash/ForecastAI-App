const { PrismaClient } = require('./ForecastAI_1_0_0_1/backend/node_modules/@prisma/client');
const p = new PrismaClient();

(async () => {
  try {
    // Find the project
    const project = await p.projectMaster.findUnique({ where: { projectId: 'TEST001' } });
    if (!project) {
      console.log('Project TEST001 not found');
      await p.$disconnect();
      return;
    }
    console.log('Found project:', project.id, project.projectId);
    
    // Delete all revenues for this project
    const revCount = await p.monthlyRevenue.deleteMany({ where: { projectId: project.id } });
    console.log('Deleted revenues:', revCount.count);
    
    // Delete the project
    const deleted = await p.projectMaster.delete({ where: { id: project.id } });
    console.log('Deleted project:', deleted.projectId);
    
    await p.$disconnect();
  } catch (e) {
    console.error('Error:', e.message);
    await p.$disconnect();
  }
})();
