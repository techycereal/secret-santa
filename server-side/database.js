// Import the necessary module for SQL Server operations
const sql = require('mssql');

// Database configuration details


/**
 * Creates a new group in the database.
 * @param {string} name - The name of the group to be created.
 * @returns {object} An object containing the groupCode and adminCode.
 */
async function createGroup(name) {
    try {
        var poolConnection = await sql.connect(config);
        const groupCode = Math.random().toString().slice(2, 7);
        const adminCode = Math.random().toString().slice(2, 7);
        await poolConnection.request()
            .input('name', sql.VarChar, name)
            .input('groupCode', sql.VarChar, groupCode)
            .input('adminCode', sql.VarChar, adminCode)
            .query('INSERT INTO SSEnterGroups (groupCode, groupName, adminCode) VALUES (@groupCode, @name, @adminCode)');
        poolConnection.close();
        return {
            groupCode: groupCode,
            adminCode: adminCode
        };
    } catch (err) {
        console.error(err.message);
    }
}

async function deleteGroup(groupCode) {
    try {
        var poolConnection = await sql.connect(config);
        await poolConnection.request()
            .input('groupCode', sql.VarChar, groupCode)
            .query('delete from SSEnterGroups where groupCode = @groupCode');
        await poolConnection.request()
            .input('groupCode', sql.VarChar, groupCode)
            .query('delete from SSGroups where groupCode = @groupCode');
        await poolConnection.request()
            .input('groupCode', sql.VarChar, groupCode)
            .query('delete from SSPairs where groupId = @groupCode');
        await poolConnection.request()
            .input('groupCode', sql.VarChar, groupCode)
            .query('delete from SSList where groupId = @groupCode');
        poolConnection.close();
        return {
            groupCode: groupCode,
            adminCode: adminCode
        };
    } catch (err) {
        console.error(err.message);
    }
}

/**
 * Adds a new member to an existing group or creates a new member if not exist.
 * @param {string} groupCode - The code of the group.
 * @param {string} name - The name of the member to add.
 * @returns {object} An object containing member lists and personId.
 */
async function add(groupCode, name) {
    try {
        var poolConnection = await sql.connect(config);
        const query = await poolConnection.request().input('groupCode', sql.VarChar, groupCode).input('name', sql.VarChar, name).query('SELECT * FROM [dbo].[SSGroups] where Person = @name and groupCode = @groupCode');
        if (query.recordset.length >= 1){
            const friend_list = await poolConnection.request().input('groupCode', sql.VarChar, groupCode).input('personId', sql.Int, query.recordset[0].personId).query('SELECT DISTINCT [dbo].[SSList].personId, [dbo].[SSList].item, [dbo].[SSGroups].Person FROM [dbo].[SSList] INNER JOIN [dbo].[SSPairs] ON [dbo].[SSList].personId = [dbo].[SSPairs].personId inner join [dbo].[SSGroups] on [dbo].[SSList].personId = [dbo].[SSGroups].personId WHERE [dbo].[SSList].groupId = @groupCode and [dbo].[SSPairs].personId2 = @personId');
            console.log(friend_list.recordset)
            console.log('-------------------------------------')
            const my_list = await poolConnection.request().input('groupCode', sql.VarChar, groupCode).input('personId', sql.Int, query.recordset[0].personId).query('SELECT * from [dbo].[SSList] where groupId = @groupCode and personId = @personId');
            poolConnection.close();
            const together = {
                'myself': my_list.recordset,
                'friend': friend_list.recordset,
                'person': query.recordset[0].personId
            }
            return together
        } else {
            await poolConnection.request().input('groupCode', sql.VarChar, groupCode).input('name', sql.VarChar, name).query('insert into SSGroups (groupCode, Person) VALUES (@groupCode, @name)');
            const query = await poolConnection.request().input('groupCode', sql.VarChar, groupCode).input('name', sql.VarChar, name).query('SELECT * FROM [dbo].[SSGroups] where Person = @name and groupCode = @groupCode');
            poolConnection.close();
            const together = {
                'myself': [],
                'friend': [],
                'person': query.recordset[0]
            }
            return together
        }
        
    } catch (err) {
        console.error(err.message);
    }
}

/**
 * Randomizes group elements and creates new pairings.
 * @param {string} groupCode - The code of the group to randomize.
 * @returns {string} 'true' if the operation was successful.
 */
async function randomize(groupCode) {
    try {
        var poolConnection = await sql.connect(config);
        const getGroup = await poolConnection.request().input('groupCode', sql.VarChar, groupCode).query('SELECT TOP 1 groupCode FROM [dbo].[SSGroups] INNER JOIN [dbo].[SSPairs] ON [dbo].[SSGroups].groupCode = [dbo].[SSPairs].groupId WHERE [dbo].[SSPairs].groupId = @groupCode;')
        console.log(getGroup.recordset)
        if (getGroup.recordset){
            await poolConnection.request().input('groupCode', sql.VarChar, groupCode).query('delete FROM [dbo].[SSPairs] where groupId = @groupCode');
        } 
            const query = await poolConnection.request().input('groupCode', sql.VarChar, groupCode).query('SELECT * FROM [dbo].[SSGroups] where groupCode = @groupCode ORDER BY NEWID();');
            let first = query.recordset[0].personId
            for (let i = 0; i < query.recordset.length; i++) {
                if (i === query.recordset.length-1){
                    await poolConnection.request().input('groupCode', sql.VarChar, groupCode).input('personId', sql.Int, query.recordset[i].personId).input('personId2', sql.Int, first).query('insert into SSPairs (groupId, personId, personId2) VALUES (@groupCode, @personId, @personId2)');    
                    return 'true'
                }
                await poolConnection.request().input('groupCode', sql.VarChar, groupCode).input('personId', sql.Int, query.recordset[i].personId).input('personId2', sql.Int, query.recordset[i+1].personId).query('insert into SSPairs (groupId, personId, personId2) VALUES (@groupCode, @personId, @personId2)');
            }
            poolConnection.close();
    } catch (err) {
        console.error(err.message);
    }
}

/**
 * Signs in a user to the group.
 * @param {string} groupCode - The code of the group to sign in.
 * @returns {object|string} Group records or 'No group by that code'.
 */
async function signin(groupCode) {
    try {
        var poolConnection = await sql.connect(config);
        
        const query = await poolConnection.request().input('groupCode', sql.VarChar, groupCode).query('SELECT * FROM [dbo].[SSGroups] where groupCode = @groupCode');
        
        if (query.recordset.length < 1){
            poolConnection.close();
            return 'No group by that code'
        } else {
            poolConnection.close();
            return query.recordset
        }
        
    } catch (err) {
        console.error(err.message);
    }
}

/**
 * Retrieves sign-in information for a group.
 * @param {string} groupCode - The code of the group.
 * @returns {object|string} Group records or 'No group by that code'.
 */
async function signins(groupCode) {
    try {
        var poolConnection = await sql.connect(config);
        
        const query = await poolConnection.request().input('groupCode', sql.VarChar, groupCode).query('SELECT * FROM [dbo].[SSEnterGroups] where groupCode = @groupCode');
        
        if (query.recordset.length < 1){
            poolConnection.close();
            return 'No group by that code'
        } else {
            poolConnection.close();
            return query.recordset
        }
        
    } catch (err) {
        console.error(err.message);
    }
}

/**
 * Writes an item to the list for a specific user and group.
 * @param {string} groupCode - The code of the group.
 * @param {string} userId - The ID of the user.
 * @param {string} item - The item to add to the list.
 */
async function write(groupCode, userId, item) {
    try {
        var poolConnection = await sql.connect(config);
        
        await poolConnection.request().input('groupCode', sql.VarChar, groupCode).input('userId', sql.Int, userId).input('item', sql.VarChar, item).query('insert into SSList (groupId, personId, item) values (@groupCode, @userId, @item)');
        poolConnection.close();
    } catch (err) {
        console.error(err.message);
    }
}

/**
 * Admin sign-in functionality.
 * @param {string} groupCode - The code of the group.
 * @param {string} adminCode - The admin code for authentication.
 * @returns {object} The recordset of the admin sign-in query.
 */
async function adminSignIn(groupCode, adminCode){
    var poolConnection = await sql.connect(config);
    const query = await poolConnection.request().input('groupCode', sql.VarChar, groupCode).input('adminCode', sql.VarChar, adminCode).query('SELECT * FROM SSEnterGroups where groupCode = @groupCode and adminCode = @adminCode');
    console.log(query)
    return query.recordset
}

/**
 * Removes a user from a group.
 * @param {string} groupCode - The code of the group.
 * @param {number} personId - The ID of the person to remove.
 */
async function removeUser(groupCode, personId){
    var poolConnection = await sql.connect(config);
    await poolConnection.request().input('groupCode', sql.VarChar, groupCode).input('personId', sql.Int, personId).query('delete from SSGroups where groupCode = @groupCode and personId = @personId');
    await poolConnection.request().input('groupCode', sql.VarChar, groupCode).input('personId', sql.Int, personId).query('delete from SSPairs where groupId = @groupCode and (personId = @personId or personId2 = @personId)');
}

// Exporting the functions to be used in other parts of the application
exports.createGroup = createGroup;
exports.add = add;
exports.randomize = randomize;
exports.signin = signin;
exports.write = write;
exports.adminSignIn = adminSignIn;
exports.signins = signins;
exports.removeUser = removeUser;
exports.deleteGroup = deleteGroup