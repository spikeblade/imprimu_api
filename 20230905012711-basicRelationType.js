'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.bulkInsert({ tableName: 'relations_types', schema: 'orders_schema', ignoreDuplicates: true }, [{
      type: 'parent-child',
      description: 'Relation between Catalog Product (Parent) and Production Product (Child)'
    }])
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('relations_types', null, {})
  }
}
