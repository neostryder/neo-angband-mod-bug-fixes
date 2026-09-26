# Text changes: Text and history fixes

Below is every change the Text and history fixes switch (`bugfix.textAndHistory`) makes to the text of Angband 4.2.6: typos, grammar mistakes, wrong facts, and descriptions of rules the game no longer has. Turn the switch off and you see the Before text, exactly as upstream wrote it. Each entry gives the upstream file and line. The switch also fixes two history bugs, which the mod's README describes.

44 description and game data changes, 10 message changes.

## Activations

### CURE_FULL (`desc`)

Upstream `lib/gamedata/activation.txt:122`, fact.

Before:

> heals 35% of max HP (minimum 300HP), cut damage, and cures stunning, poisoning, blindness, and confusion

After:

> heals 35% of lost HP (minimum 300HP), cut damage, and cures stunning, poisoning, blindness, and confusion

HEAL_HP heals a percentage of the HP you have lost, not of your maximum (effect-handler-attack.c:212, num = (mhp - chp) * m_bonus / 100, with the 300 base as the floor; activation.txt:115 dice 300+m35), so the percentage now names lost HP.

### DEEP_DESCENT (`desc`)

Upstream `lib/gamedata/activation.txt:686`, fact.

Before:

> teleports you five levels down

After:

> teleports you up to five levels below your maximum depth

DEEP_DESCENT counts from max_depth, not the current level (effect-handler-general.c:1165-1167, dungeon_get_next_level from player->max_depth with an increment of 5), and the engine's own effect text says the same (list-effects.h:41). The desc now says so.

### DESTRUCTION2 (`desc`)

Upstream `lib/gamedata/activation.txt:701`, grammar.

Before:

> destroys an area around you in the shape of a circle radius 15, and blinds you for 1d10+10 turns

After:

> destroys an area around you in the shape of a circle of radius 15, and blinds you for 1d10+10 turns

The phrase is missing the word "of". This adds it.

### SHROOM_TERROR (`desc`)

Upstream `lib/gamedata/activation.txt:1331`, grammar.

Before:

> speeds up you temporarily but also makes you mortally afraid

After:

> speeds you up temporarily but also makes you mortally afraid

The object pronoun sits in the wrong place for the phrasal verb (read as "When activated, it speeds up you temporarily"). This moves it.

## Artifacts

### 'Mundwine' (`desc`)

Upstream `lib/gamedata/artifact.txt:1166-1168`, fact.

Before:

> A massive axe with twin razor-sharp heads, so large that it usually requires two hands to wield, with spells to ward off the elements intricately engraved upon its surface in filleted gold.

After:

> A massive axe with twin razor-sharp heads, its surface intricately engraved in filleted gold with spells to ward off the elements.

Angband 4.2 removed the rule that some weapons need two hands, and this description still says the weapon needs them. The new text drops only that claim.

### 'Nimloth' (`desc`)

Upstream `lib/gamedata/artifact.txt:975-978`, grammar.

Before:

> A thin spike of thrice-forged steel caps a straight silvan shaft cut from a legendary tree, and spells to break the wills of the undead and strike cold into the breasts of your enemies lay upon this perfectly balanced spear.

After:

> A thin spike of thrice-forged steel caps a straight silvan shaft cut from a legendary tree, and spells to break the wills of the undead and strike cold into the breasts of your enemies lie upon this perfectly balanced spear.

The spells rest on the spear, which needs the intransitive present "lie" rather than the transitive "lay". This corrects the verb.

### 'Thunderfist' (`desc`)

Upstream `lib/gamedata/artifact.txt:804-806`, punctuation.

Before:

> The long-lost weapon of Kzurin, Dwarven champion of ancient Belegost Runes of strength adorn its handle, and flames and sparks roar and crackle around its massive head.

After:

> The long-lost weapon of Kzurin, Dwarven champion of ancient Belegost. &nbsp;Runes of strength adorn its handle, and flames and sparks roar and crackle around its massive head.

The first sentence has no full stop, so it runs into the second. This adds the stop and the two-space break.

### of Morgoth (`desc`)

Upstream `lib/gamedata/artifact.txt:2438-2440`, grammar.

Before:

> Containing much of the power of he who once was mightiest among the Ainur, this plain iron crown has mounted upon it the two remaining Silmarils, greatest treasures of Middle-Earth.

After:

> Containing much of the power of him who once was mightiest among the Ainur, this plain iron crown has mounted upon it the two remaining Silmarils, greatest treasures of Middle-Earth.

The pronoun is the object of "of", so it takes the objective case.

### of Wrath (`desc`)

Upstream `lib/gamedata/artifact.txt:1009-1011`, fact.

Before:

> A massive triple-pronged spear, so great it normally requires two hands to wield, evoking the spirit of Osse who with it pierced legions of evil and undead.

After:

> A massive triple-pronged spear, evoking the spirit of Osse who with it pierced legions of evil and undead.

Angband 4.2 removed the rule that some weapons need two hands, and this description still says the weapon needs them. The new text drops only that claim.

## Chest traps

### explosion device (`msg`)

Upstream `lib/gamedata/chest_trap.txt:80`, punctuation.

Before:

> There is a sudden explosion! Everything inside the chest is destroyed!

After:

> There is a sudden explosion! &nbsp;Everything inside the chest is destroyed!

The break after "!" is single-spaced where messages elsewhere use two spaces, the same slip the bug-fixes mod already corrects in four C-source messages (strings.ts). This is the gamedata copy of that fix (printed by msg() in obj-chest.c:558).

## Class spells

### Blackguard (`book.0.spell.4.desc`)

Upstream `lib/gamedata/class.txt:1665-1667`, grammar.

Before:

> You run up to 4 spaces towards targeted enemy, then perform a melee blow. &nbsp;You gain an additional blow at levels 25 and 40. &nbsp;If you moved, the number of blows is reduced by 25% for each space, then rounded.

After:

> You run up to 4 spaces towards the targeted enemy, then perform a melee blow. &nbsp;You gain an additional blow at levels 25 and 40. &nbsp;If you moved, the number of blows is reduced by 25% for each space, then rounded.

Missing article: "towards targeted enemy" becomes "towards the targeted enemy".

### Necromancer (`book.1.spell.2.desc`)

Upstream `lib/gamedata/class.txt:1053-1054`, fact.

Before:

> Attempts to put to sleep each evil monster within line of sight. &nbsp;Monsters that resist confusion are not affected.

After:

> Attempts to put to sleep each evil monster within line of sight. &nbsp;Monsters that resist sleep are not affected.

Sleep Evil casts PROJECT_LOS:SLEEP_EVIL (class.txt 1050), which sets MON_TMD_SLEEP in project_monster_sleep (src/project-mon.c 480-496), and that timer is resisted by RF_NO_SLEEP (src/list-mon-timed.h 17), not by confusion resistance. Mass Sleep already says "resist sleep".

### Necromancer (`book.4.spell.2.desc`)

Upstream `lib/gamedata/class.txt:1189-1193`, typo.

Before:

> Allows you to assume the form of a vampire at the cost of half your current hitpoints, than teleports you to the nearest living monster and drains a level-dependent number of hitpoints, healing and nourishing you. &nbsp;When first transformed you will temporarily be able to take hitpoints from living monsters with your bite attack.

After:

> Allows you to assume the form of a vampire at the cost of half your current hitpoints, then teleports you to the nearest living monster and drains a level-dependent number of hitpoints, healing and nourishing you. &nbsp;When first transformed you will temporarily be able to take hitpoints from living monsters with your bite attack.

"than teleports you" is a typo for "then teleports you". The spell shapechanges and then runs JUMP_AND_BITE (class.txt 1185-1186).

## Curses

### steelskin (`desc`)

Upstream `lib/gamedata/curse.txt:386`, grammar.

Before:

> makes your skin harder to damage, but conduct electricity

After:

> makes your skin harder to damage, but it conducts electricity

Displayed as "It makes your skin harder to damage, but conduct electricity." (obj-info.c:126-127), the second verb has no subject. This adds one without changing the meaning (curse.txt:385 RES_ELEC[-1]).

## Monsters

### 5-headed hydra (`desc`)

Upstream `lib/gamedata/monster.txt:6581`, consistency.

Before:

> A 4-headed hydra with an extra head, steaming with acidic vapor.

After:

> A 4-headed hydra with an extra head, steaming with acidic vapour.

The game uses British 'vapour' (three times in monster.txt, including the 9-headed hydra). This is the one 'vapor'.

### blood falcon (`desc`)

Upstream `lib/gamedata/monster.txt:4914-4916`, punctuation.

Before:

> A blinding whirlwind of fear and feathers. &nbsp;Its razor sharp beak and talons fill its foes with terror as it seeks to rend flesh from bone with unbridled ferocity.

After:

> A blinding whirlwind of fear and feathers. &nbsp;Its razor-sharp beak and talons fill its foes with terror as it seeks to rend flesh from bone with unbridled ferocity.

The compound adjective before a noun takes a hyphen, as in the file's other 'razor-sharp' uses (shardstorm, gelugon).

### crow (`desc`)

Upstream `lib/gamedata/monster.txt:1164`, consistency.

Before:

> It is a hooded crow, gray except for the black wings and head.

After:

> It is a hooded crow, grey except for the black wings and head.

The game spells the colour 'grey' (12 times in monster.txt, including 'grey mold' and 'grey wraith'). This is the one 'gray' in the file.

### doombat (`desc`)

Upstream `lib/gamedata/monster.txt:7669-7670`, punctuation.

Before:

> It is a fast moving creature of chaos, a gigantic black bat surrounded by flickering bright red flames.

After:

> It is a fast-moving creature of chaos, a gigantic black bat surrounded by flickering bright red flames.

The compound adjective needs its hyphen, matching 'fast-moving' elsewhere in monster.txt.

### Draugluin, Sire of All Werewolves (`desc`)

Upstream `lib/gamedata/monster.txt:14213-14214`, grammar.

Before:

> Draugluin provides Sauron with a fearsome personal guard. &nbsp;He is an enormous wolf inhabited with a human spirit. &nbsp;He is chief of all his kind.

After:

> Draugluin provides Sauron with a fearsome personal guard. &nbsp;He is an enormous wolf inhabited by a human spirit. &nbsp;He is chief of all his kind.

A body is inhabited 'by' a spirit, not 'with' one.

### drolem (`desc`)

Upstream `lib/gamedata/monster.txt:11624-11626`, grammar.

Before:

> A constructed dragon, the drolem has massive strength. &nbsp;Powerful spells weaved during its creation make it a fearsome adversary. &nbsp;Its eyes show little intelligence, but it has been instructed to destroy all it meets.

After:

> A constructed dragon, the drolem has massive strength. &nbsp;Powerful spells woven during its creation make it a fearsome adversary. &nbsp;Its eyes show little intelligence, but it has been instructed to destroy all it meets.

The past participle of 'weave' in the sense of making a spell is 'woven'. 'weaved' is the form for moving from side to side.

### Fundin Bluecloak (`desc`)

Upstream `lib/gamedata/monster.txt:12050-12053`, grammar.

Before:

> He is one of the greatest dwarven priests to walk the earth. &nbsp;Fundin has earned a high position in the church, and his skill with both weapon and spell only justify his position further. &nbsp;His combination of both dwarven strength and priestly wisdom are a true match for any adventurer.

After:

> He is one of the greatest dwarven priests to walk the earth. &nbsp;Fundin has earned a high position in the church, and his skill with both weapon and spell only justifies his position further. &nbsp;His combination of both dwarven strength and priestly wisdom is a true match for any adventurer.

Two agreement errors: the singular subjects 'his skill' and 'His combination' take 'justifies' and 'is'.

### glabrezu (`desc`)

Upstream `lib/gamedata/monster.txt:10307`, grammar.

Before:

> It is demon with arms and pincers, its form a true mockery of life.

After:

> It is a demon with arms and pincers, its form a true mockery of life.

The article is missing: 'It is demon' should be 'It is a demon'.

### half-orc (`desc`)

Upstream `lib/gamedata/monster.txt:4053-4055`, grammar.

Before:

> He is a hideous deformed cross-breed with man and orc, combining man's strength and cunning with orcish evil. &nbsp;The traitorous wizard Saruman is generally believed to be responsible for this abomination.

After:

> He is a hideous deformed cross-breed of man and orc, combining man's strength and cunning with orcish evil. &nbsp;The traitorous wizard Saruman is generally believed to be responsible for this abomination.

A cross-breed is 'of' its parent stocks, not 'with' them.

### Maia of Varda (`desc`)

Upstream `lib/gamedata/monster.txt:13101-13102`, grammar.

Before:

> A servant of Varda, Lady of the Stars, who the elves call Elbereth and love above all the Valar.

After:

> A servant of Varda, Lady of the Stars, whom the elves call Elbereth and love above all the Valar.

The relative pronoun is the object of 'call', so it is 'whom', as the enchantress's description already writes it.

### Morgoth, Lord of Darkness (`desc`)

Upstream `lib/gamedata/monster.txt:14788-14798`, fact.

Before:

> He is the Master of the Pits of Angband. &nbsp;His figure is like a black mountain crowned with lightning. &nbsp;He rages with everlasting anger, his body scarred by Fingolfin's eight mighty wounds. &nbsp;He can never rest from his pain, but seeks forever to dominate all that is light and good in the world. &nbsp;He is the origin of man's fear of darkness and created many foul creatures with his evil powers. &nbsp;Orcs, Dragons, and Trolls are his most foul corruptions, causing much pain and suffering in the world to please him. &nbsp;His disgusting visage, twisted with evil, is crowned with iron, the two remaining Silmarils forever burning him. &nbsp;Grond, the mighty Hammer of the Underworld, cries defiance as he strides towards you to crush you to a pulp!

After:

> He is the Master of the Pits of Angband. &nbsp;His figure is like a black mountain crowned with lightning. &nbsp;He rages with everlasting anger, his body scarred by Fingolfin's seven mighty wounds. &nbsp;He can never rest from his pain, but seeks forever to dominate all that is light and good in the world. &nbsp;He is the origin of man's fear of darkness and created many foul creatures with his evil powers. &nbsp;Orcs, Dragons, and Trolls are his most foul corruptions, causing much pain and suffering in the world to please him. &nbsp;His disgusting visage, twisted with evil, is crowned with iron, the two remaining Silmarils forever burning him. &nbsp;Grond, the mighty Hammer of the Underworld, cries defiance as he strides towards you to crush you to a pulp!

Fingolfin gave Morgoth seven wounds in The Silmarillion, and the game itself says so at lib/gamedata/artifact.txt line 2043 ('Morgoth seven mighty wounds'). This description says eight.

### nexus hound (`desc`)

Upstream `lib/gamedata/monster.txt:6416-6417`, grammar.

Before:

> A locus of conflicting points coalesce to form the vague shape of a huge hound. &nbsp;Or is it just your imagination?

After:

> A locus of conflicting points coalesces to form the vague shape of a huge hound. &nbsp;Or is it just your imagination?

The subject is the singular 'locus', so the verb is 'coalesces'.

### night mare (`desc`)

Upstream `lib/gamedata/monster.txt:9464-9465`, punctuation.

Before:

> A fearsome skeletal horse with glowing eyes, that watch you with little more than a hatred of all that lives.

After:

> A fearsome skeletal horse with glowing eyes that watch you with little more than a hatred of all that lives.

The comma before the restrictive 'that' splits the clause from the eyes it describes. Removing it fixes the sentence.

### ochre jelly (`desc`)

Upstream `lib/gamedata/monster.txt:3634-3635`, punctuation.

Before:

> A fast moving highly acidic jelly thing, that is eating away the floor it rests on.

After:

> A fast-moving, highly acidic jelly thing that is eating away the floor it rests on.

The compound adjective needs its hyphen (the file writes 'fast-moving' four times elsewhere) and the comma before the restrictive 'that' is removed.

### Old Man Willow (`desc`)

Upstream `lib/gamedata/monster.txt:4887-4891`, typo.

Before:

> The ancient grey willow tree, ruler of the Old Forest. &nbsp;He despises trespassers in his territory. &nbsp;"...a huge willow-tree, old and hoary. &nbsp;Enormous it looked, its sprawling branches going up like racing arms with many long-fingered hands, its knotted and twisted trunk gaping in wide fissures that creaked faintly as the boughs moved."

After:

> The ancient grey willow tree, ruler of the Old Forest. &nbsp;He despises trespassers in his territory. &nbsp;"...a huge willow-tree, old and hoary. &nbsp;Enormous it looked, its sprawling branches going up like reaching arms with many long-fingered hands, its knotted and twisted trunk gaping in wide fissures that creaked faintly as the boughs moved."

The quotation from The Fellowship of the Ring (chapter 'The Old Forest') reads 'like reaching arms', not 'racing arms'.

### Ossë, Herald of Ulmo (`desc`)

Upstream `lib/gamedata/monster.txt:13214-13218`, punctuation.

Before:

> Encrusted with barnacles, slimy and dripping, the Maia of the untamed sea has dragged himself down into Angband to send you to a watery grave. Ossë is the most powerful and heartless of Ulmo's servants and embodies the untamed power of the ocean. &nbsp;Terror grows in your heart with each squelching step of his approach.

After:

> Encrusted with barnacles, slimy and dripping, the Maia of the untamed sea has dragged himself down into Angband to send you to a watery grave. &nbsp;Ossë is the most powerful and heartless of Ulmo's servants and embodies the untamed power of the ocean. &nbsp;Terror grows in your heart with each squelching step of his approach.

One sentence break has a single space where the description, and the game's descriptions generally, use two.

### southron archer (`desc`)

Upstream `lib/gamedata/monster.txt:9338-9339`, punctuation.

Before:

> A man of Harad clad in black and red and carrying a longbow. &nbsp;His quiver is full of red feathered arrows, and carries an insignia of a black serpent.

After:

> A man of Harad clad in black and red and carrying a longbow. &nbsp;His quiver is full of red-feathered arrows, and carries an insignia of a black serpent.

The compound adjective needs its hyphen, matching the orc archer's 'black-feathered arrows'.

### Ungoliant, the Unlight (`desc`)

Upstream `lib/gamedata/monster.txt:13536-13540`, grammar.

Before:

> This enormous, hideous spirit of void is in the form of a spider of immense proportions. &nbsp;She is surrounded by a cloud of Unlight as she sucks in all living light into her bloated body, and breathes out the blackest of darkness. &nbsp;She is always ravenously hungry and would even eat herself to avoid starvation.

After:

> This enormous, hideous spirit of void is in the form of a spider of immense proportions. &nbsp;She is surrounded by a cloud of Unlight as she sucks all living light into her bloated body, and breathes out the blackest of darkness. &nbsp;She is always ravenously hungry and would even eat herself to avoid starvation.

The preposition is doubled ('sucks in ... into'). Dropping 'in' fixes it.

### Uvatha the Horseman (`desc`)

Upstream `lib/gamedata/monster.txt:13736-13737`, punctuation.

Before:

> A tall black cloaked Ringwraith, he is a master of horsemanship. &nbsp;He longs to taste your blood.

After:

> A tall black-cloaked Ringwraith, he is a master of horsemanship. &nbsp;He longs to taste your blood.

Without the hyphen 'black cloaked' reads as two separate adjectives. The compound is 'black-cloaked'.

### wererat (`desc`)

Upstream `lib/gamedata/monster.txt:3919-3920`, grammar.

Before:

> A large rat with glowing red eyes. &nbsp;The wererat is a disgusting creature, relishing in filth and disease.

After:

> A large rat with glowing red eyes. &nbsp;The wererat is a disgusting creature, revelling in filth and disease.

'Relish' takes a direct object, so 'relishing in' blends two idioms. 'revelling in' is the phrase meant.

## Monster groups

### ainu (`desc`)

Upstream `lib/gamedata/monster_base.txt:53`, consistency.

Before:

> Ainu/maia

After:

> Ainu/Maia

Every other monster_base group label capitalises each name ('Wight/Wraith', 'Xorn/Xaren', 'Zombie/Mummy'). 'maia' is the one lowercase slip.

## Objects

### & Broad Axe~ (`desc`)

Upstream `lib/gamedata/object.txt:1087`, typo.

Before:

> A simple, single-bladed war axe capable of chopping though limbs or armour.

After:

> A simple, single-bladed war axe capable of chopping through limbs or armour.

"though" is a typo for "through".

### & Jewel Encrusted Crown~ (`desc`)

Upstream `lib/gamedata/object.txt:1569-1570`, typo.

Before:

> An elaboratedly decorated crown of massive gold, studded with a rainbow of gems and jewels; worthy of a High King.

After:

> An elaborately decorated crown of massive gold, studded with a rainbow of gems and jewels; worthy of a High King.

"elaboratedly" is a misspelling of "elaborately".

### & Pike~ (`desc`)

Upstream `lib/gamedata/object.txt:1048-1049`, fact.

Before:

> A fifteen foot spear, requiring two hands to wield, principally used in infantry formations.

After:

> A fifteen foot spear, principally used in infantry formations.

Angband 4.2 removed the rule that some weapons need two hands, and this description still says the weapon needs them. The new text drops only that claim.

### & Ration~ of Food (`desc`)

Upstream `lib/gamedata/object.txt:305-307`, punctuation.

Before:

> This nutritious but fairly bland food, called cram by the Lake-men who make it is familiar to anyone contemplating long journeys. &nbsp;It is sustaining, but very uninteresting except as a chewing exercise.

After:

> This nutritious but fairly bland food, called cram by the Lake-men who make it, is familiar to anyone contemplating long journeys. &nbsp;It is sustaining, but very uninteresting except as a chewing exercise.

The parenthetical "called cram by the Lake-men who make it" opens with a comma but never closes one. This adds the closing comma.

### & Two-Handed Great Flail~ (`desc`)

Upstream `lib/gamedata/object.txt:886-887`, fact.

Before:

> Two great bars of wood connected by a massive chain, needing two hands to properly wield.

After:

> Two great bars of wood connected by a massive chain, built to deliver crushing blows.

Angband 4.2 removed the rule that some weapons need two hands, and this description still says the weapon needs them. The new text drops only that claim.

## Player properties

### Slow Digestion (`desc`)

Upstream `lib/gamedata/player_property.txt:199`, grammar.

Before:

> You have slow metabolism.

After:

> You have a slow metabolism.

Missing article: "You have slow metabolism" becomes "You have a slow metabolism".

## Timed effects

### COMMAND (`on-end`)

Upstream `lib/gamedata/player_timed.txt:524`, typo.

Before:

> Your resume control of your own body.

After:

> You resume control of your own body.

"Your resume control" is a typo for "You resume control".

### HEAL (`on-end`)

Upstream `lib/gamedata/player_timed.txt:519`, grammar.

Before:

> Your metabolism return to normal.

After:

> Your metabolism returns to normal.

Subject-verb agreement: "metabolism return" becomes "metabolism returns".

## Terrain

### Home (`desc`)

Upstream `lib/gamedata/terrain.txt:244-245`, typo.

Before:

> Your safe piece of Middle Earth, and the only place you can store goods apart from on your person.

After:

> Your safe piece of Middle-earth, and the only place you can store goods apart from on your person.

Tolkien spells the name "Middle-earth" (monster.txt 12493 uses that form). This is the only unhyphenated "Middle Earth" in the game data.

## Messages

### Bad effect passed to effect_do(). Please report this bug.

Upstream `src/effects.c:399`, punctuation.

Before:

> Bad effect passed to effect_do(). Please report this bug.

After:

> Bad effect passed to effect_do(). &nbsp;Please report this bug.

Angband 4.2.6 puts two spaces after a sentence in almost every message, and this one uses one. The fix adds the second space.

### The ground shakes! The ceiling caves in!

Upstream `src/effect-handler-attack.c:1322`, punctuation.

Before:

> The ground shakes! The ceiling caves in!

After:

> The ground shakes! &nbsp;The ceiling caves in!

Angband 4.2.6 puts two spaces after a sentence in almost every message, and this one uses one. The fix adds the second space.

### Warning! Could not allocate a new monster.

Upstream `src/mon-make.c:1509`, punctuation.

Before:

> Warning! Could not allocate a new monster.

After:

> Warning! &nbsp;Could not allocate a new monster.

Angband 4.2.6 puts two spaces after a sentence in almost every message, and this one uses one. The fix adds the second space.

### Oops! It feels deathly cold!

Upstream `src/obj-gear.c:1005`, punctuation.

Before:

> Oops! It feels deathly cold!

After:

> Oops! &nbsp;It feels deathly cold!

Angband 4.2.6 puts two spaces after a sentence in almost every message, and this one uses one. The fix adds the second space.

### The dungeon does not appear to extend deeper

Upstream `src/cmd-cave.c:117`, punctuation.

Before:

> The dungeon does not appear to extend deeper

After:

> The dungeon does not appear to extend deeper.

The message has no closing full stop, unlike every sibling staircase message. The change adds one.

### The item cannot be used at the moment

Upstream `src/cmd-obj.c:997`, punctuation.

Before:

> The item cannot be used at the moment

After:

> The item cannot be used at the moment.

The message has no closing full stop, unlike the "Equip the item to use it." message printed beside it. The change adds one.

### lore save failed!

Upstream `src/ui-game.c:1077`, typo.

Before:

> lore save failed!

After:

> Lore save failed!

The message opens with a lower-case letter where every other message is capitalised. The change capitalises it.

### death save failed!

Upstream `src/ui-game.c:1139`, typo.

Before:

> death save failed!

After:

> Death save failed!

The message opens with a lower-case letter where every other message is capitalised. The change capitalises it.

### That %s had no useable energy

Upstream `src/effect-handler-general.c:3403`, punctuation. `%s` and `%d` stand for text the game fills in.

Before:

> That %s had no useable energy

After:

> That %s had no useable energy.

The message has no closing full stop, unlike the "Your mana was already at its maximum." message from the same effect. The change adds one.

### You steal %d gold pieces worth of treasure.

Upstream `src/mon-util.c:1480`, grammar. `%s` and `%d` stand for text the game fills in.

Before:

> You steal %d gold pieces worth of treasure.

After:

> You steal %d gold pieces' worth of treasure.

"gold pieces worth" needs the plural possessive apostrophe ("pieces' worth"). The change adds it.
