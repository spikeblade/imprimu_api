'use strict'
module.exports = {
  up: async function (queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {}, { schema: 'orders_schema' })
    const tableDefinition = await queryInterface.describeTable('orders')
    if (!tableDefinition.id) {
      await queryInterface.addColumn('orders', 'id',
        {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.DataTypes.INTEGER
        }, { schema: 'orders_schema' }
      )
    }
    if (!tableDefinition.total_price) {
      await queryInterface.addColumn('orders', 'total_price',
        {
          allowNull: false,
          type: Sequelize.DataTypes.FLOAT
        }, { schema: 'orders_schema' }
      )
    }
    if (!tableDefinition.order_number) {
      await queryInterface.addColumn('orders', 'order_number',
        {
          allowNull: true,
          type: Sequelize.DataTypes.STRING
        }, { schema: 'orders_schema' }
      )
    }
    if (!tableDefinition.created) {
      await queryInterface.addColumn('orders', 'created',
        {
          allowNull: false,
          defaultValue: {},
          type: Sequelize.DataTypes.DATE
        }, { schema: 'orders_schema' }
      )
    }
    if (!tableDefinition.updated) {
      await queryInterface.addColumn('orders', 'updated',
        {
          allowNull: true,
          type: Sequelize.DataTypes.DATE
        }, { schema: 'orders_schema' }
      )
    }
    if (!tableDefinition.status_id) {
      await queryInterface.addColumn('orders', 'status_id',
        {
          allowNull: false,
          type: Sequelize.DataTypes.INTEGER,
          references: {
            model: {
              tableName: 'status',
              table: 'status',
              name: 'status',
              schema: 'orders_schema',
              delimiter: '.'
            },
            key: 'id'
          },
          onDelete: 'NO ACTION',
          onUpdate: 'CASCADE'
        }, { schema: 'orders_schema' }
      )
    }
    if (!tableDefinition.reorder) {
      await queryInterface.addColumn('orders', 'reorder',
        {
          allowNull: false,
          defaultValue: false,
          type: Sequelize.DataTypes.BOOLEAN
        }, { schema: 'orders_schema' }
      )
    }
    if (!tableDefinition.from_order_id) {
      await queryInterface.addColumn('orders', 'from_order_id',
        {
          allowNull: false,
          type: Sequelize.DataTypes.INTEGER,
          references: {
            model: {
              tableName: 'orders',
              table: 'orders',
              name: 'order',
              schema: 'orders_schema',
              delimiter: '.'
            },
            key: 'id'
          },
          onDelete: 'NO ACTION',
          onUpdate: 'CASCADE'
        }, { schema: 'orders_schema' }
      )
    }
    if (!tableDefinition.store_id) {
      await queryInterface.addColumn('orders', 'store_id',
        {
          allowNull: true,
          type: Sequelize.DataTypes.INTEGER,
          references: {
            model: {
              tableName: 'stores',
              table: 'stores',
              name: 'store',
              schema: 'orders_schema',
              delimiter: '.'
            },
            key: 'id'
          },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE'
        }, { schema: 'orders_schema' }
      )
    }
  },
  down: function (queryInterface, Sequelize) {
    return queryInterface.dropTable('orders', { schema: 'orders_schema' })
  }
}
