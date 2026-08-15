const prisma = require('../utils/prisma');
const paginate = require('../utils/paginate');

exports.getAllMessages = async (req, res) => {
  try {
    const result = await paginate('message', req, {
      searchField: 'title',
      sort: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMessageById = async (req, res) => {
  try {
    const message = await prisma.message.findUnique({ where: { id: req.params.id } });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createMessage = async (req, res) => {
  try {
    const message = await prisma.message.create({ data: req.body });

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateMessage = async (req, res) => {
  try {
    const message = await prisma.message.update({
      where: { id: req.params.id },
      data: req.body
    });

    res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    await prisma.message.delete({ where: { id: req.params.id } });

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};
