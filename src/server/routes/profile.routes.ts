import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      age: 30,
      gender: '男',
      height: 175,
      weight: 70,
      fitnessLevel: '初级',
      goal: '保持健康',
      allergies: [],
      chronicDiseases: []
    }
  });
});

router.put('/', (req, res) => {
  const profileData = req.body;
  console.log('Profile update:', profileData);

  res.json({
    success: true,
    message: '档案更新成功'
  });
});

export default router;
