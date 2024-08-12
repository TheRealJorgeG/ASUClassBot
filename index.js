const fs = require('fs')
const User = require('./User.js');


//Main Functions
async function addClass(userId, classNum) {
    try {
        const userExists = await checkUser(userId);
        if (!userExists) {
            await addUser(userId);
        }

        // Find the user before updating to check the existing classes
        const user = await User.findOne({ userId });

        if (user) {
            if (user.classes.includes(classNum)) {
                console.log(`User ${userId} already has class ${classNum}`);
                return;
            }

            // Add the class, using $addToSet to ensure no duplicates
            const result = await User.findOneAndUpdate(
                { userId },
                { $addToSet: { classes: classNum } },
                { new: true }
            );

            if (result) {
                console.log(`Class ${classNum} added to user ${userId}`);
            } else {
                console.log(`User ${userId} not found`);
            }
        } else {
            console.log(`User ${userId} not found`);
        }
    } catch (error) {
        console.error('Error adding class:', error);
    }
}

async function removeClass(userId, classNum) {
    const userExists = await checkUser(userId);
    if (!userExists) {
        console.log(`User does not exist`)
        return
    }
    const result = await User.findOneAndUpdate({ userId }, { $pull: { classes: classNum } }, { new: true });
    const user = await User.findOne({ userId });
    if (user && user.classes.length === 0) {
        // Delete the user if no classes remain
        await removeUser(userId);
        console.log(`User ${userId} deleted as they have no remaining classes`);
    } else {
        console.log(`Class ${classNum} removed from user ${userId}`);
    }
}

//Secondary Functions
async function addUser(userId) {
    try {
        // Create a new user if they do not exist
        const newUser = new User({ userId, classes: [] });
        await newUser.save();
    } catch (error) {
        console.error('Error adding user:', error);
    }
}

async function removeUser(userId) {
    if (!(checkUser(userId))) {
        console.log(`User does not exist`)
        return
    }
    const result = await User.deleteOne({ userId });
}

async function checkUser(userId) {
    const user = await User.findOne({ userId });
    return user !== null;
}

async function showClasses(userId) {
    try {
        // Find the user by userId
        const user = await User.findOne({ userId });
        
        if (!user) {
            console.log(`User ${userId} not found`);
            return [];  // Return an empty array if the user is not found
        }

        // Return the array of classes
        if (user.classes.length > 0) {
            return user.classes;  // Return the array of class numbers
        } else {
            console.log(`User ${userId} has no classes`);
            return [];  // Return an empty array if there are no classes
        }
    } catch (error) {
        console.error('Error retrieving classes:', error);
        return [];  // Return an empty array in case of an error
    }
}


module.exports = {addClass, removeClass, showClasses}