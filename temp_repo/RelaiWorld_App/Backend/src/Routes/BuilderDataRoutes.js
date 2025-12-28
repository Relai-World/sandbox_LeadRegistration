const express = require('express');
const router = express.Router();
const {
  GetAllBuilders,
  GetProjectNames,
  GetProjectDetails,
  GetBuilderById,
  CreateBuilder,
  UpdateBuilder,
  DeleteBuilder
} = require('../Controller/BuilderDataController');

router.get('/', GetAllBuilders);

router.get('/project-names', GetProjectNames);

router.get('/project-details/:projectName', GetProjectDetails);

router.get('/:id', GetBuilderById);

router.post('/', CreateBuilder);

router.put('/:id', UpdateBuilder);

router.delete('/:id', DeleteBuilder);

module.exports = router;
