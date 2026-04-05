const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'CLB Võ Cổ Truyền HUTECH API',
            version: '1.0.0',
            description: 'API documentation for CLB Võ Cổ Truyền HUTECH management system',
            contact: {
                name: 'CLB Võ Cổ Truyền HUTECH',
                email: 'voco@hutech.edu.vn',
                url: 'https://hutech.edu.vn'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server'
            },
            {
                url: 'https://api.vocotruyenhutech.edu.vn',
                description: 'Production server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter JWT token'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        email: { type: 'string', format: 'email', example: 'user@example.com' },
                        username: { type: 'string', example: 'johndoe' },
                        first_name: { type: 'string', example: 'John' },
                        last_name: { type: 'string', example: 'Doe' },
                        phone_number: { type: 'string', example: '0909123456' },
                        role: { 
                            type: 'string', 
                            enum: ['admin', 'instructor', 'student', 'member'],
                            example: 'student'
                        },
                        membership_status: {
                            type: 'string',
                            enum: ['active', 'inactive', 'pending', 'suspended', 'expired'],
                            example: 'active'
                        },
                        belt_level: {
                            type: 'string',
                            enum: ['white', 'yellow', 'orange', 'green', 'blue', 'brown', 'black'],
                            example: 'white'
                        },
                        created_at: { type: 'string', format: 'date-time' }
                    }
                },
                Class: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        name: { type: 'string', example: 'Võ Cơ Bản A1' },
                        description: { type: 'string' },
                        instructor_id: { type: 'integer', example: 2 },
                        level: {
                            type: 'string',
                            enum: ['beginner', 'intermediate', 'advanced', 'expert'],
                            example: 'beginner'
                        },
                        schedule: { type: 'string', example: 'Thứ 2, 4, 6 - 18:00-19:30' },
                        start_date: { type: 'string', format: 'date', example: '2025-02-01' },
                        max_students: { type: 'integer', example: 15 },
                        current_students: { type: 'integer', example: 10 },
                        fee: { type: 'number', format: 'decimal', example: 300000 },
                        status: {
                            type: 'string',
                            enum: ['active', 'inactive', 'completed', 'cancelled'],
                            example: 'active'
                        }
                    }
                },
                Event: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        title: { type: 'string', example: 'Giải Thi Đấu Võ Cổ Truyền 2025' },
                        description: { type: 'string' },
                        type: {
                            type: 'string',
                            enum: ['tournament', 'demonstration', 'workshop', 'seminar', 'social', 'training_camp'],
                            example: 'tournament'
                        },
                        start_date: { type: 'string', format: 'date', example: '2025-03-15' },
                        start_time: { type: 'string', format: 'time', example: '08:00:00' },
                        location: { type: 'string', example: 'Sân tập CLB' },
                        max_participants: { type: 'integer', example: 50 },
                        registration_fee: { type: 'number', format: 'decimal', example: 100000 },
                        status: {
                            type: 'string',
                            enum: ['scheduled', 'ongoing', 'completed', 'cancelled', 'postponed'],
                            example: 'scheduled'
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string', example: 'Error message' },
                        errors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    field: { type: 'string' },
                                    message: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                Success: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'Operation successful' },
                        data: { type: 'object' }
                    }
                }
            },
            responses: {
                UnauthorizedError: {
                    description: 'Access token is missing or invalid',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' }
                        }
                    }
                },
                ForbiddenError: {
                    description: 'Insufficient permissions',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' }
                        }
                    }
                },
                NotFoundError: {
                    description: 'Resource not found',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' }
                        }
                    }
                },
                ValidationError: {
                    description: 'Validation failed',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' }
                        }
                    }
                }
            }
        },
        tags: [
            {
                name: 'Authentication',
                description: 'User authentication and authorization'
            },
            {
                name: 'Users',
                description: 'User management operations'
            },
            {
                name: 'Classes',
                description: 'Class management operations'
            },
            {
                name: 'Events',
                description: 'Event management operations'
            },
            {
                name: 'Attendance',
                description: 'Attendance tracking operations'
            },
            {
                name: 'Notifications',
                description: 'Notification management'
            },
            {
                name: 'Contact',
                description: 'Contact form operations'
            },
            {
                name: 'Admin',
                description: 'Administrative operations'
            }
        ]
    },
    apis: ['./routes/*.js'] // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;