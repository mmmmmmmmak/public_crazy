const { vk, getVkNameById, questionManager, vkMsg } = require('./VK')

const { mainMenu, persMenu, admpanel } = require('./keyboard')

const { User, Game } = require('./db')

const { api } = vk

const { commandManager } = require('./crazytime')
const { lsmanager } = require('./lsbota')
const { donate } = require('./qiwi')

vk.updates.use(questionManager.middleware);

setInterval(async () => {
    let date = new Date()
    console.log(`${date.getDate()}:${date.getHours()}:${date.getMinutes()}`)
    if (`${date.getDate()}:${date.getHours()}:${date.getMinutes()}` == `1:21:0`) {
        console.log(`${date.getDate()}:${date.getHours()}:${date.getMinutes()}`)
        const toppers = await User.find({ topmonth: { $gt: 0 } }).sort({ topmonth: -1 })

        const award = [10000000, 5000000, 2500000, 1500000, 1000000, 750000, 500000, 250000, 100000, 50000]

        for (let pos = 0; pos < toppers.length; pos++) {
            toppers[pos].money += award[pos]
            toppers[pos].save()
        }

        const sbros = await User.updateMany({ topmonth: { $ne: 0 } }, { topmonth: 0 })
        console.log(sbros.modifiedCount)
    }
}, 60000);

setInterval(async () => {
    let date = new Date()
    console.log(`${date.getHours()}:${date.getMinutes()}`)
    if (`${date.getHours()}:${date.getMinutes()}` == `21:0`) {
        console.log(`${date.getHours()}:${date.getMinutes()}`)
        const toppers = await User.find({ topday: { $gt: 0 } }).sort({ topday: -1 })

        const award = [1000000, 750000, 500000, 250000, 100000, 50000, 30000, 25000, 15000, 5000]

        for (let pos = 0; pos < toppers.length; pos++) {
            toppers[pos].money += award[pos]
            toppers[pos].save()
        }

        const sbros = await User.updateMany({ topday: { $ne: 0 } }, { topday: 0 })
        console.log(sbros.modifiedCount)

    }
}, 60000);

vk.updates.on('like', async (ctx) => {
    const findUser = await User.findOne({ id: ctx.likerId })
    if (!findUser) return
    if (ctx.subTypes[0] == 'like_add') {
        findUser.money += 400
        findUser.save()
        return vkMsg(ctx.likerId, `???? ?????????????????? ???? ???????? ??????????!\n???? ???? ???????? ???????????? ?????????????????? 400 ????.`)
    }
    if (ctx.subTypes[0] == 'like_remove') {
        findUser.money -= 400
        findUser.save()
        return vkMsg(ctx.likerId, `???? ???? ?????????? ???????? ?? ??????????, ?? ??????????????????????...\n???? ?? ???????????? ?????????????? ?????????????? 400 ????.`)
    }

})

vk.updates.on('comment', async (ctx) => {
    if (ctx.subTypes[1] == 'wall_reply_new') {
        const findUser = await User.findOne({ id: ctx.fromId })
        if (!findUser) return
        findUser.money += 1500
        findUser.save()
        return vkMsg(ctx.fromId, `???? ?????????????????? ???????? ???? ?????????????????????? ??????????????????????!\n???? ???? ???????? ???????????? ?????????????????? 1500 ????.`)
    }
    if (ctx.subTypes[1] == 'wall_reply_delete') {
        const findUser = await User.findOne({ id: ctx.deleterUserId })
        if (!findUser) return
        findUser.money -= 1500
        findUser.save()
        return vkMsg(ctx.deleterUserId, `???? ?? ??????????????????????, ???? ???????????? ???????? ??????????????????????...\n???? ?? ???????????? ?????????????? ?????????????? 1500 ????.`)
    }
})

vk.updates.on('message_new', async (msg) => {
    const name = await getVkNameById(msg.senderId)
    const findUser = await User.findOne({ id: msg.senderId });
    if (msg.isChat && !findUser) {
        msg.send(`???? ????, ??????????????????, ?????? ????????????????????:`,
            {
                keyboard: mainMenu
            })

        const newUser = new User({
            id: msg.senderId,
            nick: name,
            money: 200,
        })

        newUser.save((error) => {

            if (error) {
                return 'Internal Server Error'
            }

        });
    }
    if (msg.isChat && findUser) {
        if (msg.text.includes('/????????????????????')) {
            return msg.send(`???????????????????? ????????????????!`,
                {
                    keyboard: mainMenu
                })
        }
        if (msg.text.includes('/?????????????? ????????')) {
            if (findUser.owner > 3) {
                const newGame = new Game({
                    id: 1,
                    bank: 0,
                    players: 0,
                    x1: 0,
                    x2: 0,
                    x5: 0,
                    x10: 0,
                    coinfl: 0,
                    pachi: 0,
                    cash: 0,
                    plays: 6,
                    crazy: 0
                })

                newGame.save((error) => {

                    if (error) {
                        return 'Internal Server Error'
                    }

                });

                return msg.send(`???????? ??????????????.`)
            }
        }
        else {
            commandManager(msg)
        }
    }
    if (!msg.isChat && !findUser) {
        const newUser = new User({
            id: msg.senderId,
            nick: name,
            money: 200,
        })

        newUser.save((error) => {

            if (error) {
                return 'Internal Server Error'
            }

        });

        return msg.send(`??? ????????????, ${name}, ?????? ?????? ??????????????:`,
            {
                keyboard: persMenu
            })
    }
    if (!msg.isChat && findUser) {
        if (msg.text.includes('/????????????????????')) {
            return msg.send('???????????????????? ????????????????!',
                {
                    keyboard: persMenu
                })
        }
        if (msg.text == '/??????????-????????????') {
            if (findUser.owner > 0) {
                return msg.send('??????????-????????????:', {
                    keyboard: admpanel
                })
            } else {
                return msg.send(`???????????? ????????????????`)
            }
        }

        if (msg.messagePayload.command == 'depositing' || msg.messagePayload.command == 'check' || msg.messagePayload.command == 'exit') {
            return donate(msg)
        }

        if (msg.messagePayload.command == 'checkct' || msg.messagePayload.command == 'givemoney' || msg.messagePayload.command == 'tozero') {
            return commandManager(msg)
        }

        else {
            lsmanager(msg)
        }
    }
})

console.log('?????? ?????? ??????????????!');
vk.updates.start().catch(console.error);