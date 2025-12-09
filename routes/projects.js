const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { verifyToken } = require('../middleware/auth');

// Middleware to check authentication
router.use(verifyToken);

// GET all projects (admin sees all, employees see their own)
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let query = {};

    // If user is not admin, filter by createdBy or assignTo
    if (userRole !== 'admin') {
      query = {
        $or: [
          { createdBy: userId },
          { assignTo: userId }
        ]
      };
    }

    const projects = await Project.find(query)
      .populate('createdBy', 'name email')
      .populate('assignTo', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
      error: error.message
    });
  }
});

// GET single project by ID
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignTo', 'name email');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project',
      error: error.message
    });
  }
});

// CREATE new project
router.post('/', async (req, res) => {
  try {
    const {
      title,
      projectType,
      contractor,
      consultant,
      sizeOfProject,
      products,
      stage,
      assignTo,
      startDate,
      endDate,
      description,
      meeting
    } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Project title is required'
      });
    }

    // Create new project
    const newProject = new Project({
      title,
      projectType: projectType || undefined,
      contractor: contractor || undefined,
      consultant: consultant || undefined,
      sizeOfProject: sizeOfProject || undefined,
      products: products && Array.isArray(products) ? products : undefined,
      stage: stage || undefined,
      assignTo: assignTo || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      description: description || undefined,
      meeting: meeting || undefined,
      createdBy: req.user._id,
      assignBy: req.user._id,
      lastUpdate: new Date()
    });

    const savedProject = await newProject.save();

    // Populate references
    const populatedProject = await Project.findById(savedProject._id)
      .populate('createdBy', 'name email')
      .populate('assignTo', 'name email');

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: populatedProject
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: error.message
    });
  }
});

// UPDATE project by ID
router.put('/:id', async (req, res) => {
  try {
    const {
      title,
      projectType,
      contractor,
      consultant,
      sizeOfProject,
      products,
      stage,
      assignTo,
      startDate,
      endDate,
      description,
      meeting
    } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Project title is required'
      });
    }

    const updateData = {
      title,
      projectType: projectType || undefined,
      contractor: contractor || undefined,
      consultant: consultant || undefined,
      sizeOfProject: sizeOfProject || undefined,
      products: products && Array.isArray(products) ? products : undefined,
      stage: stage || undefined,
      assignTo: assignTo || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      description: description || undefined,
      meeting: meeting || undefined,
      lastUpdate: new Date()
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email')
     .populate('assignTo', 'name email');

    if (!updatedProject) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: updatedProject
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project',
      error: error.message
    });
  }
});

// DELETE project by ID
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project',
      error: error.message
    });
  }
});

module.exports = router;
