const {DataTypes}=require('sequelize');
const sequelize=require('../config/database');
const User=require('./User');

const Message=sequelize.define('Message',{
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    content:{
        type: DataTypes.TEXT,
        allowNull:false
    },
    sender_id:{
        type:DataTypes.INTEGER,
        allowNull: false,
        references: {
            model:User,
            key:'id',
        },
    },
    receiver_id:{
        type:DataTypes.INTEGER,
        allowNull: false,
        references: {
            model:User,
            key:'id',
        },
    },
    read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
},{
    timestamps:true,
    tableName: 'messages'
});

Message.belongsTo(User, {
    as: 'sender',
    foreignKey: 'sender_id',
    targetKey: 'id'
});

Message.belongsTo(User, {
    as: 'receiver',
    foreignKey: 'receiver_id',
    targetKey: 'id'
});

module.exports=Message;