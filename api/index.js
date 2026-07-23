const express = require('express');
const axios = require('axios');
const slugify = require('slugify');
const fs = require('fs');
const path = require('path');

const app = express();
const DOMAIN = 'https://vexn.org';

// -------------------------------------------------------------
// AI-generated unique SEO descriptions
// -------------------------------------------------------------
let PAGE_DESCRIPTIONS = {};
let PAGE_DESCRIPTIONS_MANUAL = {};
try {
    const raw = fs.readFileSync(path.join(__dirname, '..', 'data', 'descriptions.json'), 'utf8');
    PAGE_DESCRIPTIONS = JSON.parse(raw);
} catch (err) {
    PAGE_DESCRIPTIONS = {};
}
try {
    const raw = fs.readFileSync(path.join(__dirname, '..', 'data', 'descriptions-manual.json'), 'utf8');
    PAGE_DESCRIPTIONS_MANUAL = JSON.parse(raw);
} catch (err) {
    PAGE_DESCRIPTIONS_MANUAL = {};
}

function getDescription(type, slug, fallback) {
    const key = `${type}:${slug}`;
    return PAGE_DESCRIPTIONS_MANUAL[key] || PAGE_DESCRIPTIONS[key] || fallback;
}

// -------------------------------------------------------------
// Performer "About" bio paragraphs
// -------------------------------------------------------------
let PERFORMER_BIOS = {};
let PERFORMER_BIOS_MANUAL = {};
try {
    const raw = fs.readFileSync(path.join(__dirname, '..', 'data', 'performer-bios.json'), 'utf8');
    PERFORMER_BIOS = JSON.parse(raw);
} catch (err) {
    PERFORMER_BIOS = {};
}
try {
    const raw = fs.readFileSync(path.join(__dirname, '..', 'data', 'performer-bios-manual.json'), 'utf8');
    PERFORMER_BIOS_MANUAL = JSON.parse(raw);
} catch (err) {
    PERFORMER_BIOS_MANUAL = {};
}

function renderBioSection(slug) {
    const bio = PERFORMER_BIOS_MANUAL[slug] || PERFORMER_BIOS[slug];
    if (!bio) return '';
    return `
        <div class="bg-slate-900/60 border border-slate-800 rounded-lg p-4 mb-4">
            <h2 class="text-sm font-bold text-slate-300 mb-1 uppercase tracking-wide">About</h2>
            <p class="text-sm text-slate-400">${bio}</p>
        </div>
    `;
}

// -------------------------------------------------------------
// 1. REAL DATA LISTS
// -------------------------------------------------------------
const CHANNELS = [
    { slug: 'brazzers', label: 'Brazzers', blurb: 'Videos from the Brazzers studio/channel.' },
    { slug: 'blacked', label: 'Blacked', blurb: 'Videos from the Blacked studio/channel.' },
    { slug: 'familyxxx', label: 'FamilyXXX', blurb: 'Videos from the FamilyXXX studio/channel.' },
    { slug: 'new-sensations', label: 'New Sensations', blurb: 'Videos from the New Sensations studio/channel.' },
    { slug: 'my-family-pies', label: 'My Family Pies', blurb: 'Videos from the My Family Pies studio/channel.' },
    { slug: 'mylf', label: 'MYLF', blurb: 'Videos from the MYLF studio/channel.' },
    { slug: 'deeper', label: 'Deeper', blurb: 'Videos from the Deeper studio/channel.' },
    { slug: 'passion-hd', label: 'Passion-HD', blurb: 'Videos from the Passion-HD studio/channel.' },
    { slug: 'nf-busty', label: 'NF Busty', blurb: 'Videos from the NF Busty studio/channel.' },
    { slug: 'bad-milfs', label: 'Bad MILFS', blurb: 'Videos from the Bad MILFS studio/channel.' },
    { slug: 'family-strokes', label: 'Family Strokes', blurb: 'Videos from the Family Strokes studio/channel.' },
    { slug: 'babes', label: 'Babes', blurb: 'Videos from the Babes studio/channel.' },
    { slug: 'blacked-raw', label: 'Blacked Raw', blurb: 'Videos from the Blacked Raw studio/channel.' },
    { slug: 'exotic-4k', label: 'Exotic 4K', blurb: 'Videos from the Exotic 4K studio/channel.' },
    { slug: 'teens-love-black-cocks', label: 'Teens Love Black Cocks', blurb: 'Videos from the Teens Love Black Cocks studio/channel.' },
    { slug: 'vip-members', label: 'VIP Members', blurb: 'Videos from the VIP Members studio/channel.' },
    { slug: '18-years-old-girls', label: '18 Years Old Girls', blurb: 'Videos from the 18 Years Old Girls studio/channel.' },
    { slug: 'milfy', label: 'MILFY', blurb: 'Videos from the MILFY studio/channel.' },
    { slug: 'lets-doe-it', label: 'Lets Doe It', blurb: 'Videos from the Lets Doe It studio/channel.' },
    { slug: 'vip-4k', label: 'VIP 4K', blurb: 'Videos from the VIP 4K studio/channel.' },
    { slug: 'realitykings', label: 'RealityKings', blurb: 'Videos from the RealityKings studio/channel.' },
    { slug: 'tushy-raw', label: 'Tushy Raw', blurb: 'Videos from the Tushy Raw studio/channel.' },
    { slug: 'come-inside', label: 'Come Inside', blurb: 'Videos from the Come Inside studio/channel.' },
    { slug: 'lil-humpers', label: 'Lil Humpers', blurb: 'Videos from the Lil Humpers studio/channel.' },
    { slug: '21-naturals', label: '21 Naturals', blurb: 'Videos from the 21 Naturals studio/channel.' },
    { slug: 'twistys', label: 'Twistys', blurb: 'Videos from the Twistys studio/channel.' },
    { slug: 'dad-crush', label: 'Dad Crush', blurb: 'Videos from the Dad Crush studio/channel.' },
    { slug: 'rocco-siffredi', label: 'Rocco Siffredi', blurb: 'Videos from the Rocco Siffredi studio/channel.' },
    { slug: 'fantasy-hd', label: 'Fantasy HD', blurb: 'Videos from the Fantasy HD studio/channel.' },
    { slug: 'japan-hdv', label: 'Japan HDV', blurb: 'Videos from the Japan HDV studio/channel.' },
    { slug: 'anilos', label: 'Anilos', blurb: 'Videos from the Anilos studio/channel.' },
    { slug: 'dirtyflix', label: 'DirtyFlix', blurb: 'Videos from the DirtyFlix studio/channel.' },
    { slug: 'innocent-high', label: 'Innocent High', blurb: 'Videos from the Innocent High studio/channel.' },
    { slug: 'magmafilm', label: 'Magmafilm', blurb: 'Videos from the Magmafilm studio/channel.' },
    { slug: 'exxxtra-small', label: 'Exxxtra Small', blurb: 'Videos from the Exxxtra Small studio/channel.' },
    { slug: 'mofos', label: 'MOFOS', blurb: 'Videos from the MOFOS studio/channel.' },
    { slug: 'bbc-pie', label: 'BBC Pie', blurb: 'Videos from the BBC Pie studio/channel.' },
    { slug: 'anal-4k', label: 'Anal 4k', blurb: 'Videos from the Anal 4k studio/channel.' },
    { slug: '21-sextury', label: '21 Sextury', blurb: 'Videos from the 21 Sextury studio/channel.' },
    { slug: 'bitches-abroad', label: 'Bitches Abroad', blurb: 'Videos from the Bitches Abroad studio/channel.' },
    { slug: 'defloration-tv', label: 'Defloration TV', blurb: 'Videos from the Defloration TV studio/channel.' },
    { slug: 'porn-cz', label: 'Porn CZ', blurb: 'Videos from the Porn CZ studio/channel.' },
    { slug: 'wicked', label: 'Wicked', blurb: 'Videos from the Wicked studio/channel.' },
    { slug: 'family-lust', label: 'Family Lust', blurb: 'Videos from the Family Lust studio/channel.' },
    { slug: 'enjoyx', label: 'EnjoyX', blurb: 'Videos from the EnjoyX studio/channel.' },
    { slug: 'the-white-boxxx', label: 'The White Boxxx', blurb: 'Videos from the The White Boxxx studio/channel.' },
    { slug: 'older-woman-fun', label: 'Older Woman Fun', blurb: 'Videos from the Older Woman Fun studio/channel.' },
    { slug: 'joy-bear', label: 'Joy Bear', blurb: 'Videos from the Joy Bear studio/channel.' },
    { slug: 'vixen', label: 'VIXEN', blurb: 'Videos from the VIXEN studio/channel.' },
    { slug: 'metart', label: 'MetArt', blurb: 'Videos from the MetArt studio/channel.' },
    { slug: 'adult-time', label: 'Adult Time', blurb: 'Videos from the Adult Time studio/channel.' },
    { slug: '247mg', label: '247MG', blurb: 'Videos from the 247MG studio/channel.' },
    { slug: 'teamskeet', label: 'TeamSkeet', blurb: 'Videos from the TeamSkeet studio/channel.' },
    { slug: 'naughty-america', label: 'Naughty America', blurb: 'Videos from the Naughty America studio/channel.' },
    { slug: 'she-will-cheat', label: 'She Will Cheat', blurb: 'Videos from the She Will Cheat studio/channel.' },
    { slug: 'sexy-momma', label: 'Sexy Momma', blurb: 'Videos from the Sexy Momma studio/channel.' },
    { slug: 'bratty-sis', label: 'Bratty Sis', blurb: 'Videos from the Bratty Sis studio/channel.' },
    { slug: 'purgatoryx', label: 'PurgatoryX', blurb: 'Videos from the PurgatoryX studio/channel.' },
    { slug: '5kporn', label: '5KPORN', blurb: 'Videos from the 5KPORN studio/channel.' },
    { slug: 'hotwifexxx', label: 'HotwifeXXX', blurb: 'Videos from the HotwifeXXX studio/channel.' },
    { slug: 'squirted', label: 'Squirted', blurb: 'Videos from the Squirted studio/channel.' },
    { slug: 'hardwerkcom', label: 'Hardwerk.com', blurb: 'Videos from the Hardwerk.com studio/channel.' },
    { slug: 'zero-tolerance', label: 'Zero Tolerance', blurb: 'Videos from the Zero Tolerance studio/channel.' },
    { slug: 'fetish-hits', label: 'Fetish Hits', blurb: 'Videos from the Fetish Hits studio/channel.' },
    { slug: 'jav-hub', label: 'JAV Hub', blurb: 'Videos from the JAV Hub studio/channel.' },
    { slug: 'all-anal', label: 'All Anal', blurb: 'Videos from the All Anal studio/channel.' },
    { slug: 'pornlandvideos', label: 'Pornlandvideos', blurb: 'Videos from the Pornlandvideos studio/channel.' },
    { slug: 'nubiles-porn', label: 'Nubiles Porn', blurb: 'Videos from the Nubiles Porn studio/channel.' },
    { slug: 'cum-4k', label: 'Cum 4K', blurb: 'Videos from the Cum 4K studio/channel.' },
    { slug: 'massage-creep', label: 'Massage Creep', blurb: 'Videos from the Massage Creep studio/channel.' },
    { slug: 'casting-coach-x', label: 'Casting Coach X', blurb: 'Videos from the Casting Coach X studio/channel.' },
    { slug: 'javhd', label: 'JavHD', blurb: 'Videos from the JavHD studio/channel.' },
    { slug: 'deep-lush', label: 'Deep Lush', blurb: 'Videos from the Deep Lush studio/channel.' },
    { slug: 'pornpros', label: 'PornPros', blurb: 'Videos from the PornPros studio/channel.' },
    { slug: 'porn-fidelity', label: 'Porn Fidelity', blurb: 'Videos from the Porn Fidelity studio/channel.' },
    { slug: 'nubile-films', label: 'Nubile Films', blurb: 'Videos from the Nubile Films studio/channel.' },
    { slug: 'mile-high-media', label: 'Mile High Media', blurb: 'Videos from the Mile High Media studio/channel.' },
    { slug: 'true-anal', label: 'True Anal', blurb: 'Videos from the True Anal studio/channel.' },
    { slug: 'evil-angel', label: 'Evil Angel', blurb: 'Videos from the Evil Angel studio/channel.' },
    { slug: 'girl-cum', label: 'Girl Cum', blurb: 'Videos from the Girl Cum studio/channel.' },
    { slug: 'iluvteens', label: 'iluvteens', blurb: 'Videos from the iluvteens studio/channel.' },
    { slug: 'puba-the-pornstar-network', label: 'PUBA - The Pornstar Network', blurb: 'Videos from the PUBA - The Pornstar Network studio/channel.' },
    { slug: 'jav-hd', label: 'Jav HD', blurb: 'Videos from the Jav HD studio/channel.' },
    { slug: 'vipissy', label: 'VIPissy', blurb: 'Videos from the VIPissy studio/channel.' },
    { slug: 'italianshotclub', label: 'italianshotclub', blurb: 'Videos from the italianshotclub studio/channel.' },
    { slug: 'pure-mature', label: 'Pure Mature', blurb: 'Videos from the Pure Mature studio/channel.' },
    { slug: 'look-at-her-now', label: 'Look At Her Now', blurb: 'Videos from the Look At Her Now studio/channel.' },
    { slug: 'fetish-network', label: 'Fetish Network', blurb: 'Videos from the Fetish Network studio/channel.' },
    { slug: 'teen-bff', label: 'Teen BFF', blurb: 'Videos from the Teen BFF studio/channel.' },
    { slug: '3amxxx', label: '3AMXXX', blurb: 'Videos from the 3AMXXX studio/channel.' },
    { slug: 'property-sex', label: 'Property Sex', blurb: 'Videos from the Property Sex studio/channel.' },
    { slug: 'stiffia', label: 'Stiffia', blurb: 'Videos from the Stiffia studio/channel.' },
    { slug: 'harmonyvision', label: 'HarmonyVision', blurb: 'Videos from the HarmonyVision studio/channel.' },
    { slug: 'gloryhole-secrets', label: 'Gloryhole Secrets', blurb: 'Videos from the Gloryhole Secrets studio/channel.' },
    { slug: 'av-69', label: 'AV 69', blurb: 'Videos from the AV 69 studio/channel.' },
    { slug: 'bemeficom', label: 'Bemefi.com', blurb: 'Videos from the Bemefi.com studio/channel.' },
    { slug: 'a-girl-knows', label: 'A Girl Knows', blurb: 'Videos from the A Girl Knows studio/channel.' },
    { slug: 'hussie-pass', label: 'Hussie Pass', blurb: 'Videos from the Hussie Pass studio/channel.' },
    { slug: 'erito', label: 'ERITO', blurb: 'Videos from the ERITO studio/channel.' },
    { slug: 'myslutwifegoesblack', label: 'Myslutwifegoesblack', blurb: 'Videos from the Myslutwifegoesblack studio/channel.' },
    { slug: 'stella-cardo', label: 'Stella Cardo', blurb: 'Videos from the Stella Cardo studio/channel.' },
    { slug: 'tiny-4k', label: 'Tiny 4K', blurb: 'Videos from the Tiny 4K studio/channel.' },
    { slug: 'white-ghetto', label: 'White Ghetto', blurb: 'Videos from the White Ghetto studio/channel.' },
    { slug: 'oblowjobs', label: 'oblowjobs', blurb: 'Videos from the oblowjobs studio/channel.' },
    { slug: 'passionpovcom', label: 'Passionpov.com', blurb: 'Videos from the Passionpov.com studio/channel.' },
    { slug: 'nympho', label: 'Nympho', blurb: 'Videos from the Nympho studio/channel.' },
    { slug: 'swallowed', label: 'Swallowed', blurb: 'Videos from the Swallowed studio/channel.' },
    { slug: 'wtf-pass', label: 'WTF Pass', blurb: 'Videos from the WTF Pass studio/channel.' },
    { slug: 'club-sweethearts', label: 'Club Sweethearts', blurb: 'Videos from the Club Sweethearts studio/channel.' },
    { slug: 'real-ex-girlfriends', label: 'Real Ex Girlfriends', blurb: 'Videos from the Real Ex Girlfriends studio/channel.' },
    { slug: 'dfxtra', label: 'DFXtra', blurb: 'Videos from the DFXtra studio/channel.' },
    { slug: 'ad-4x', label: 'Ad 4X', blurb: 'Videos from the Ad 4X studio/channel.' },
    { slug: 'inn-of-sin', label: 'Inn of Sin', blurb: 'Videos from the Inn of Sin studio/channel.' },
    { slug: 'wankitnow', label: 'WankItNow', blurb: 'Videos from the WankItNow studio/channel.' },
    { slug: 'bellesa-films', label: 'Bellesa Films', blurb: 'Videos from the Bellesa Films studio/channel.' },
    { slug: 'fakehub', label: 'Fakehub', blurb: 'Videos from the Fakehub studio/channel.' },
    { slug: 'cannonprodcom', label: 'CannonProd.com', blurb: 'Videos from the CannonProd.com studio/channel.' },
    { slug: 'puffy-network', label: 'Puffy Network', blurb: 'Videos from the Puffy Network studio/channel.' },
    { slug: 'tough-lovex', label: 'Tough LoveX', blurb: 'Videos from the Tough LoveX studio/channel.' },
    { slug: 'pornforce', label: 'PornForce', blurb: 'Videos from the PornForce studio/channel.' },
    { slug: 'oblackgirls', label: 'oblackgirls', blurb: 'Videos from the oblackgirls studio/channel.' },
    { slug: 'bums-bus', label: 'Bums Bus', blurb: 'Videos from the Bums Bus studio/channel.' },
    { slug: 'sologirlsmania', label: 'SoloGirlsMania', blurb: 'Videos from the SoloGirlsMania studio/channel.' },
    { slug: 'homegrown', label: 'HomeGrown', blurb: 'Videos from the HomeGrown studio/channel.' },
    { slug: 'teenagecorruption', label: 'TeenageCorruption', blurb: 'Videos from the TeenageCorruption studio/channel.' },
    { slug: 'fuxers-network', label: 'Fuxers Network', blurb: 'Videos from the Fuxers Network studio/channel.' },
    { slug: 'my-dirty-hobby', label: 'My Dirty Hobby', blurb: 'Videos from the My Dirty Hobby studio/channel.' },
    { slug: 'dagfs-network', label: 'DaGFs Network', blurb: 'Videos from the DaGFs Network studio/channel.' },
    { slug: 'lesbiantribe', label: 'Lesbiantribe', blurb: 'Videos from the Lesbiantribe studio/channel.' },
    { slug: 'karups-network', label: 'Karups Network', blurb: 'Videos from the Karups Network studio/channel.' },
    { slug: 'holed', label: 'HOLED', blurb: 'Videos from the HOLED studio/channel.' },
    { slug: 'adult-member-zone', label: 'Adult Member Zone', blurb: 'Videos from the Adult Member Zone studio/channel.' },
    { slug: 'myveryfirsttime', label: 'MyVeryFirstTime', blurb: 'Videos from the MyVeryFirstTime studio/channel.' },
    { slug: 'nanny-spy', label: 'Nanny Spy', blurb: 'Videos from the Nanny Spy studio/channel.' },
    { slug: 'sexyhub', label: 'Sexyhub', blurb: 'Videos from the Sexyhub studio/channel.' },
    { slug: 'aziani', label: 'Aziani', blurb: 'Videos from the Aziani studio/channel.' },
    { slug: 'filf', label: 'FILF', blurb: 'Videos from the FILF studio/channel.' },
    { slug: 'baberotica', label: 'Baberotica', blurb: 'Videos from the Baberotica studio/channel.' },
    { slug: 'gotfilled', label: 'GotFilled', blurb: 'Videos from the GotFilled studio/channel.' },
    { slug: 'true-amateurs', label: 'True Amateurs', blurb: 'Videos from the True Amateurs studio/channel.' },
    { slug: 'relaxxxed', label: 'Relaxxxed', blurb: 'Videos from the Relaxxxed studio/channel.' },
    { slug: 'swank-pass', label: 'Swank Pass', blurb: 'Videos from the Swank Pass studio/channel.' },
    { slug: 'blackcockpassion', label: 'Blackcockpassion', blurb: 'Videos from the Blackcockpassion studio/channel.' },
    { slug: 'burning-angel', label: 'Burning Angel', blurb: 'Videos from the Burning Angel studio/channel.' },
    { slug: 'iluvmilfs', label: 'iluvmilfs', blurb: 'Videos from the iluvmilfs studio/channel.' },
    { slug: 'femjoy', label: 'FemJoy', blurb: 'Videos from the FemJoy studio/channel.' },
    { slug: 'spy-fam', label: 'Spy Fam', blurb: 'Videos from the Spy Fam studio/channel.' },
    { slug: 'digital-playground', label: 'Digital Playground', blurb: 'Videos from the Digital Playground studio/channel.' },
    { slug: 'deviant-hardcore', label: 'Deviant Hardcore', blurb: 'Videos from the Deviant Hardcore studio/channel.' },
    { slug: 'devils-film', label: 'Devil\'s Film', blurb: 'Videos from the Devil\'s Film studio/channel.' },
    { slug: 'x-empire', label: 'X Empire', blurb: 'Videos from the X Empire studio/channel.' },
    { slug: 'blow-pass', label: 'Blow Pass', blurb: 'Videos from the Blow Pass studio/channel.' },
    { slug: 'pascals-subsluts', label: 'Pascal\'s Subsluts', blurb: 'Videos from the Pascal\'s Subsluts studio/channel.' },
    { slug: 'fullpornnetwork', label: 'FullPornNetwork', blurb: 'Videos from the FullPornNetwork studio/channel.' },
    { slug: 'teen-fidelity', label: 'Teen Fidelity', blurb: 'Videos from the Teen Fidelity studio/channel.' },
    { slug: 'vogov', label: 'VOGOV', blurb: 'Videos from the VOGOV studio/channel.' },
    { slug: 'mormon-girlz', label: 'Mormon Girlz', blurb: 'Videos from the Mormon Girlz studio/channel.' },
    { slug: 'chicas-loca', label: 'Chicas Loca', blurb: 'Videos from the Chicas Loca studio/channel.' },
    { slug: 'club-tug', label: 'Club Tug', blurb: 'Videos from the Club Tug studio/channel.' },
    { slug: 'dog-fart-network', label: 'Dog Fart Network', blurb: 'Videos from the Dog Fart Network studio/channel.' },
    { slug: 'smut-puppet-network', label: 'Smut Puppet Network', blurb: 'Videos from the Smut Puppet Network studio/channel.' },
    { slug: 'cum-louder', label: 'Cum Louder', blurb: 'Videos from the Cum Louder studio/channel.' },
    { slug: 'lovehomeporn', label: 'LoveHomePorn', blurb: 'Videos from the LoveHomePorn studio/channel.' },
    { slug: 'old-nanny', label: 'Old Nanny', blurb: 'Videos from the Old Nanny studio/channel.' },
    { slug: 'czech-av', label: 'Czech AV', blurb: 'Videos from the Czech AV studio/channel.' },
    { slug: 'the-female-orgasm', label: 'The Female Orgasm', blurb: 'Videos from the The Female Orgasm studio/channel.' },
    { slug: 'my-18teens', label: 'My 18teens', blurb: 'Videos from the My 18teens studio/channel.' },
    { slug: 'baeb', label: 'BAEB', blurb: 'Videos from the BAEB studio/channel.' },
    { slug: 'lezkiss', label: 'LezKiss', blurb: 'Videos from the LezKiss studio/channel.' },
    { slug: 'lubed', label: 'Lubed', blurb: 'Videos from the Lubed studio/channel.' },
    { slug: 'povd', label: 'POVD', blurb: 'Videos from the POVD studio/channel.' },
    { slug: 'hitzefrei', label: 'Hitzefrei', blurb: 'Videos from the Hitzefrei studio/channel.' },
    { slug: 'upox', label: 'UPOX', blurb: 'Videos from the UPOX studio/channel.' },
    { slug: 'anal-only', label: 'Anal Only', blurb: 'Videos from the Anal Only studio/channel.' },
    { slug: 'bffs', label: 'BFFS', blurb: 'Videos from the BFFS studio/channel.' },
    { slug: 'slutinspection', label: 'SlutInspection', blurb: 'Videos from the SlutInspection studio/channel.' },
    { slug: 'inserted', label: 'Inserted', blurb: 'Videos from the Inserted studio/channel.' },
    { slug: 'rickys-room', label: 'Ricky\'s Room', blurb: 'Videos from the Ricky\'s Room studio/channel.' },
    { slug: 'slayed', label: 'Slayed', blurb: 'Videos from the Slayed studio/channel.' },
    { slug: 'amaraw', label: 'Amaraw', blurb: 'Videos from the Amaraw studio/channel.' },
];

const CATEGORIES = [
    { slug: '18-years', label: '18 Years', blurb: 'Browse 18 Years videos and clips, updated regularly.' },
    { slug: '3d', label: '3D', blurb: 'Browse 3D videos and clips, updated regularly.' },
    { slug: '69', label: '69', blurb: 'Browse 69 videos and clips, updated regularly.' },
    { slug: 'adorable', label: 'Adorable', blurb: 'Browse Adorable videos and clips, updated regularly.' },
    { slug: 'amateur', label: 'Amateur', blurb: 'Browse Amateur videos and clips, updated regularly.' },
    { slug: 'american', label: 'American', blurb: 'Browse American videos and clips, updated regularly.', country: true },
    { slug: 'anal', label: 'Anal', blurb: 'Browse Anal videos and clips, updated regularly.' },
    { slug: 'anime', label: 'Anime', blurb: 'Browse Anime videos and clips, updated regularly.' },
    { slug: 'arab', label: 'Arab', blurb: 'Browse Arab videos and clips, updated regularly.', country: true },
    { slug: 'asian', label: 'Asian', blurb: 'Browse Asian videos and clips, updated regularly.', country: true },
    { slug: 'ass-lick', label: 'Ass Lick', blurb: 'Browse Ass Lick videos and clips, updated regularly.' },
    { slug: 'babes', label: 'Babes', blurb: 'Browse Babes videos and clips, updated regularly.' },
    { slug: 'babysitter', label: 'Babysitter', blurb: 'Browse Babysitter videos and clips, updated regularly.' },
    { slug: 'backseat', label: 'Backseat', blurb: 'Browse Backseat videos and clips, updated regularly.' },
    { slug: 'ball-licking', label: 'Ball Licking', blurb: 'Browse Ball Licking videos and clips, updated regularly.' },
    { slug: 'bath', label: 'Bath', blurb: 'Browse Bath videos and clips, updated regularly.' },
    { slug: 'bbc', label: 'BBC', blurb: 'Browse BBC videos and clips, updated regularly.' },
    { slug: 'bbw', label: 'BBW', blurb: 'Browse BBW videos and clips, updated regularly.' },
    { slug: 'bdsm', label: 'BDSM', blurb: 'Browse BDSM videos and clips, updated regularly.' },
    { slug: 'beach', label: 'Beach', blurb: 'Browse Beach videos and clips, updated regularly.' },
    { slug: 'beautiful', label: 'Beautiful', blurb: 'Browse Beautiful videos and clips, updated regularly.' },
    { slug: 'behind-the-scenes', label: 'Behind The Scenes', blurb: 'Browse Behind The Scenes videos and clips, updated regularly.' },
    { slug: 'beurette', label: 'Beurette', blurb: 'Browse Beurette videos and clips, updated regularly.' },
    { slug: 'big-ass', label: 'Big Ass', blurb: 'Browse Big Ass videos and clips, updated regularly.' },
    { slug: 'big-cock', label: 'Big Cock', blurb: 'Browse Big Cock videos and clips, updated regularly.' },
    { slug: 'big-natural-boobs', label: 'Big Natural Boobs', blurb: 'Browse Big Natural Boobs videos and clips, updated regularly.' },
    { slug: 'big-tits', label: 'Big Tits', blurb: 'Browse Big Tits videos and clips, updated regularly.' },
    { slug: 'bikini', label: 'Bikini', blurb: 'Browse Bikini videos and clips, updated regularly.' },
    { slug: 'bisexual', label: 'Bisexual', blurb: 'Browse Bisexual videos and clips, updated regularly.' },
    { slug: 'black', label: 'Black', blurb: 'Browse Black videos and clips, updated regularly.' },
    { slug: 'black-cock', label: 'Black Cock', blurb: 'Browse Black Cock videos and clips, updated regularly.' },
    { slug: 'blind-folded', label: 'Blind Folded', blurb: 'Browse Blind Folded videos and clips, updated regularly.' },
    { slug: 'blonde', label: 'Blonde', blurb: 'Browse Blonde videos and clips, updated regularly.' },
    { slug: 'blowbang', label: 'Blowbang', blurb: 'Browse Blowbang videos and clips, updated regularly.' },
    { slug: 'blowjob', label: 'Blowjob', blurb: 'Browse Blowjob videos and clips, updated regularly.' },
    { slug: 'bodybuilder', label: 'Bodybuilder', blurb: 'Browse Bodybuilder videos and clips, updated regularly.' },
    { slug: 'bondage', label: 'Bondage', blurb: 'Browse Bondage videos and clips, updated regularly.' },
    { slug: 'boots', label: 'Boots', blurb: 'Browse Boots videos and clips, updated regularly.' },
    { slug: 'brazilian', label: 'Brazilian', blurb: 'Browse Brazilian videos and clips, updated regularly.', country: true },
    { slug: 'british', label: 'British', blurb: 'Browse British videos and clips, updated regularly.', country: true },
    { slug: 'brunette', label: 'Brunette', blurb: 'Browse Brunette videos and clips, updated regularly.' },
    { slug: 'brutal', label: 'Brutal', blurb: 'Browse Brutal videos and clips, updated regularly.' },
    { slug: 'bubble-butt', label: 'Bubble Butt', blurb: 'Browse Bubble Butt videos and clips, updated regularly.' },
    { slug: 'bukkake', label: 'Bukkake', blurb: 'Browse Bukkake videos and clips, updated regularly.' },
    { slug: 'busty', label: 'Busty', blurb: 'Browse Busty videos and clips, updated regularly.' },
    { slug: 'butt-plug', label: 'Butt Plug', blurb: 'Browse Butt Plug videos and clips, updated regularly.' },
    { slug: 'cameltoe', label: 'Cameltoe', blurb: 'Browse Cameltoe videos and clips, updated regularly.' },
    { slug: 'car', label: 'Car', blurb: 'Browse Car videos and clips, updated regularly.' },
    { slug: 'cartoon', label: 'Cartoon', blurb: 'Browse Cartoon videos and clips, updated regularly.' },
    { slug: 'cash', label: 'Cash', blurb: 'Browse Cash videos and clips, updated regularly.' },
    { slug: 'casting', label: 'Casting', blurb: 'Browse Casting videos and clips, updated regularly.' },
    { slug: 'caught', label: 'Caught', blurb: 'Browse Caught videos and clips, updated regularly.' },
    { slug: 'celeb', label: 'Celeb', blurb: 'Browse Celeb videos and clips, updated regularly.' },
    { slug: 'cfnm', label: 'CFNM', blurb: 'Browse CFNM videos and clips, updated regularly.' },
    { slug: 'cheating', label: 'Cheating', blurb: 'Browse Cheating videos and clips, updated regularly.' },
    { slug: 'cheerleader', label: 'Cheerleader', blurb: 'Browse Cheerleader videos and clips, updated regularly.' },
    { slug: 'chinese', label: 'Chinese', blurb: 'Browse Chinese videos and clips, updated regularly.', country: true },
    { slug: 'chubby', label: 'Chubby', blurb: 'Browse Chubby videos and clips, updated regularly.' },
    { slug: 'classroom', label: 'Classroom', blurb: 'Browse Classroom videos and clips, updated regularly.' },
    { slug: 'closeup', label: 'Closeup', blurb: 'Browse Closeup videos and clips, updated regularly.' },
    { slug: 'clothed', label: 'Clothed', blurb: 'Browse Clothed videos and clips, updated regularly.' },
    { slug: 'club', label: 'Club', blurb: 'Browse Club videos and clips, updated regularly.' },
    { slug: 'college', label: 'College', blurb: 'Browse College videos and clips, updated regularly.' },
    { slug: 'colombian', label: 'Colombian', blurb: 'Browse Colombian videos and clips, updated regularly.', country: true },
    { slug: 'compilation', label: 'Compilation', blurb: 'Browse Compilation videos and clips, updated regularly.' },
    { slug: 'cosplay', label: 'Cosplay', blurb: 'Browse Cosplay videos and clips, updated regularly.' },
    { slug: 'couch', label: 'Couch', blurb: 'Browse Couch videos and clips, updated regularly.' },
    { slug: 'cougar', label: 'Cougar', blurb: 'Browse Cougar videos and clips, updated regularly.' },
    { slug: 'couple', label: 'Couple', blurb: 'Browse Couple videos and clips, updated regularly.' },
    { slug: 'cowgirl', label: 'Cowgirl', blurb: 'Browse Cowgirl videos and clips, updated regularly.' },
    { slug: 'crazy-sex', label: 'Crazy Sex', blurb: 'Browse Crazy Sex videos and clips, updated regularly.' },
    { slug: 'creampie', label: 'Creampie', blurb: 'Browse Creampie videos and clips, updated regularly.' },
    { slug: 'cuckold', label: 'Cuckold', blurb: 'Browse Cuckold videos and clips, updated regularly.' },
    { slug: 'cumshot', label: 'Cumshot', blurb: 'Browse Cumshot videos and clips, updated regularly.' },
    { slug: 'curvy', label: 'Curvy', blurb: 'Browse Curvy videos and clips, updated regularly.' },
    { slug: 'cute', label: 'Cute', blurb: 'Browse Cute videos and clips, updated regularly.' },
    { slug: 'czech', label: 'Czech', blurb: 'Browse Czech videos and clips, updated regularly.', country: true },
    { slug: 'daddy', label: 'Daddy', blurb: 'Browse Daddy videos and clips, updated regularly.' },
    { slug: 'deepthroat', label: 'Deepthroat', blurb: 'Browse Deepthroat videos and clips, updated regularly.' },
    { slug: 'dildo', label: 'Dildo', blurb: 'Browse Dildo videos and clips, updated regularly.' },
    { slug: 'dirty-talk', label: 'Dirty Talk', blurb: 'Browse Dirty Talk videos and clips, updated regularly.' },
    { slug: 'doctor', label: 'Doctor', blurb: 'Browse Doctor videos and clips, updated regularly.' },
    { slug: 'doggystyle', label: 'Doggystyle', blurb: 'Browse Doggystyle videos and clips, updated regularly.' },
    { slug: 'domination', label: 'Domination', blurb: 'Browse Domination videos and clips, updated regularly.' },
    { slug: 'double-penetration', label: 'Double Penetration', blurb: 'Browse Double Penetration videos and clips, updated regularly.' },
    { slug: 'ebony', label: 'Ebony', blurb: 'Browse Ebony videos and clips, updated regularly.' },
    { slug: 'emo', label: 'Emo', blurb: 'Browse Emo videos and clips, updated regularly.' },
    { slug: 'erotic', label: 'Erotic', blurb: 'Browse Erotic videos and clips, updated regularly.' },
    { slug: 'european', label: 'European', blurb: 'Browse European videos and clips, updated regularly.', country: true },
    { slug: 'exotic', label: 'Exotic', blurb: 'Browse Exotic videos and clips, updated regularly.' },
    { slug: 'extreme', label: 'Extreme', blurb: 'Browse Extreme videos and clips, updated regularly.' },
    { slug: 'face-fuck', label: 'Face Fuck', blurb: 'Browse Face Fuck videos and clips, updated regularly.' },
    { slug: 'facesitting', label: 'Facesitting', blurb: 'Browse Facesitting videos and clips, updated regularly.' },
    { slug: 'facial', label: 'Facial', blurb: 'Browse Facial videos and clips, updated regularly.' },
    { slug: 'fake-tits', label: 'Fake Tits', blurb: 'Browse Fake Tits videos and clips, updated regularly.' },
    { slug: 'family', label: 'Family', blurb: 'Browse Family videos and clips, updated regularly.' },
    { slug: 'fat', label: 'Fat', blurb: 'Browse Fat videos and clips, updated regularly.' },
    { slug: 'femdom', label: 'Femdom', blurb: 'Browse Femdom videos and clips, updated regularly.' },
    { slug: 'fetish', label: 'Fetish', blurb: 'Browse Fetish videos and clips, updated regularly.' },
    { slug: 'ffm', label: 'FFM', blurb: 'Browse FFM videos and clips, updated regularly.' },
    { slug: 'fingering', label: 'Fingering', blurb: 'Browse Fingering videos and clips, updated regularly.' },
    { slug: 'first-time', label: 'First Time', blurb: 'Browse First Time videos and clips, updated regularly.' },
    { slug: 'fishnet', label: 'Fishnet', blurb: 'Browse Fishnet videos and clips, updated regularly.' },
    { slug: 'fisting', label: 'Fisting', blurb: 'Browse Fisting videos and clips, updated regularly.' },
    { slug: 'fitness', label: 'Fitness', blurb: 'Browse Fitness videos and clips, updated regularly.' },
    { slug: 'flashing', label: 'Flashing', blurb: 'Browse Flashing videos and clips, updated regularly.' },
    { slug: 'flexible', label: 'Flexible', blurb: 'Browse Flexible videos and clips, updated regularly.' },
    { slug: 'fmm', label: 'FMM', blurb: 'Browse FMM videos and clips, updated regularly.' },
    { slug: 'foot-fetish', label: 'Foot Fetish', blurb: 'Browse Foot Fetish videos and clips, updated regularly.' },
    { slug: 'foursome', label: 'Foursome', blurb: 'Browse Foursome videos and clips, updated regularly.' },
    { slug: 'french', label: 'French', blurb: 'Browse French videos and clips, updated regularly.', country: true },
    { slug: 'fucking-machine', label: 'Fucking Machine', blurb: 'Browse Fucking Machine videos and clips, updated regularly.' },
    { slug: 'funny', label: 'Funny', blurb: 'Browse Funny videos and clips, updated regularly.' },
    { slug: 'gagging', label: 'Gagging', blurb: 'Browse Gagging videos and clips, updated regularly.' },
    { slug: 'gangbang', label: 'Gangbang', blurb: 'Browse Gangbang videos and clips, updated regularly.' },
    { slug: 'gaping', label: 'Gaping', blurb: 'Browse Gaping videos and clips, updated regularly.' },
    { slug: 'garter-belt', label: 'Garter Belt', blurb: 'Browse Garter Belt videos and clips, updated regularly.' },
    { slug: 'german', label: 'German', blurb: 'Browse German videos and clips, updated regularly.', country: true },
    { slug: 'girlfriend', label: 'Girlfriend', blurb: 'Browse Girlfriend videos and clips, updated regularly.' },
    { slug: 'glamorous', label: 'Glamorous', blurb: 'Browse Glamorous videos and clips, updated regularly.' },
    { slug: 'glasses', label: 'Glasses', blurb: 'Browse Glasses videos and clips, updated regularly.' },
    { slug: 'gloryhole', label: 'Gloryhole', blurb: 'Browse Gloryhole videos and clips, updated regularly.' },
    { slug: 'gonzo', label: 'Gonzo', blurb: 'Browse Gonzo videos and clips, updated regularly.' },
    { slug: 'gorgeous', label: 'Gorgeous', blurb: 'Browse Gorgeous videos and clips, updated regularly.' },
    { slug: 'goth', label: 'Goth', blurb: 'Browse Goth videos and clips, updated regularly.' },
    { slug: 'grandpa', label: 'Grandpa', blurb: 'Browse Grandpa videos and clips, updated regularly.' },
    { slug: 'granny', label: 'Granny', blurb: 'Browse Granny videos and clips, updated regularly.' },
    { slug: 'group-sex', label: 'Group Sex', blurb: 'Browse Group Sex videos and clips, updated regularly.' },
    { slug: 'gym', label: 'Gym', blurb: 'Browse Gym videos and clips, updated regularly.' },
    { slug: 'hairy', label: 'Hairy', blurb: 'Browse Hairy videos and clips, updated regularly.' },
    { slug: 'handcuffed', label: 'Handcuffed', blurb: 'Browse Handcuffed videos and clips, updated regularly.' },
    { slug: 'handjob', label: 'Handjob', blurb: 'Browse Handjob videos and clips, updated regularly.' },
    { slug: 'hardcore', label: 'Hardcore', blurb: 'Browse Hardcore videos and clips, updated regularly.' },
    { slug: 'hd-porn', label: 'HD Porn', blurb: 'Browse HD Porn videos and clips, updated regularly.' },
    { slug: 'hentai', label: 'Hentai', blurb: 'Browse Hentai videos and clips, updated regularly.' },
    { slug: 'high-heels', label: 'High Heels', blurb: 'Browse High Heels videos and clips, updated regularly.' },
    { slug: 'homemade', label: 'Homemade', blurb: 'Browse Homemade videos and clips, updated regularly.' },
    { slug: 'hospital', label: 'Hospital', blurb: 'Browse Hospital videos and clips, updated regularly.' },
    { slug: 'hotel', label: 'Hotel', blurb: 'Browse Hotel videos and clips, updated regularly.' },
    { slug: 'housewife', label: 'Housewife', blurb: 'Browse Housewife videos and clips, updated regularly.' },
    { slug: 'hungarian', label: 'Hungarian', blurb: 'Browse Hungarian videos and clips, updated regularly.', country: true },
    { slug: 'husband', label: 'Husband', blurb: 'Browse Husband videos and clips, updated regularly.' },
    { slug: 'indian', label: 'Indian', blurb: 'Browse Indian videos and clips, updated regularly.', country: true },
    { slug: 'innocent', label: 'Innocent', blurb: 'Browse Innocent videos and clips, updated regularly.' },
    { slug: 'interracial', label: 'Interracial', blurb: 'Browse Interracial videos and clips, updated regularly.' },
    { slug: 'italian', label: 'Italian', blurb: 'Browse Italian videos and clips, updated regularly.', country: true },
    { slug: 'japanese', label: 'Japanese', blurb: 'Browse Japanese videos and clips, updated regularly.', country: true },
    { slug: 'jeans', label: 'Jeans', blurb: 'Browse Jeans videos and clips, updated regularly.' },
    { slug: 'joi', label: 'JOI', blurb: 'Browse JOI videos and clips, updated regularly.' },
    { slug: 'kinky', label: 'Kinky', blurb: 'Browse Kinky videos and clips, updated regularly.' },
    { slug: 'kissing', label: 'Kissing', blurb: 'Browse Kissing videos and clips, updated regularly.' },
    { slug: 'kitchen', label: 'Kitchen', blurb: 'Browse Kitchen videos and clips, updated regularly.' },
    { slug: 'korean', label: 'Korean', blurb: 'Browse Korean videos and clips, updated regularly.', country: true },
    { slug: 'latex', label: 'Latex', blurb: 'Browse Latex videos and clips, updated regularly.' },
    { slug: 'latina', label: 'Latina', blurb: 'Browse Latina videos and clips, updated regularly.', country: true },
    { slug: 'leggings', label: 'Leggings', blurb: 'Browse Leggings videos and clips, updated regularly.' },
    { slug: 'legs', label: 'Legs', blurb: 'Browse Legs videos and clips, updated regularly.' },
    { slug: 'lesbian', label: 'Lesbian', blurb: 'Browse Lesbian videos and clips, updated regularly.' },
    { slug: 'lezdom', label: 'Lezdom', blurb: 'Browse Lezdom videos and clips, updated regularly.' },
    { slug: 'lingerie', label: 'Lingerie', blurb: 'Browse Lingerie videos and clips, updated regularly.' },
    { slug: 'long-haired', label: 'Long Haired', blurb: 'Browse Long Haired videos and clips, updated regularly.' },
    { slug: 'long-legged', label: 'Long Legged', blurb: 'Browse Long Legged videos and clips, updated regularly.' },
    { slug: 'maid', label: 'Maid', blurb: 'Browse Maid videos and clips, updated regularly.' },
    { slug: 'massage', label: 'Massage', blurb: 'Browse Massage videos and clips, updated regularly.' },
    { slug: 'masturbation', label: 'Masturbation', blurb: 'Browse Masturbation videos and clips, updated regularly.' },
    { slug: 'mature', label: 'Mature', blurb: 'Browse Mature videos and clips, updated regularly.' },
    { slug: 'medical', label: 'Medical', blurb: 'Browse Medical videos and clips, updated regularly.' },
    { slug: 'mexican', label: 'Mexican', blurb: 'Browse Mexican videos and clips, updated regularly.', country: true },
    { slug: 'midget', label: 'Midget', blurb: 'Browse Midget videos and clips, updated regularly.' },
    { slug: 'milf', label: 'MILF', blurb: 'Browse MILF videos and clips, updated regularly.' },
    { slug: 'miniskirt', label: 'Miniskirt', blurb: 'Browse Miniskirt videos and clips, updated regularly.' },
    { slug: 'missionary', label: 'Missionary', blurb: 'Browse Missionary videos and clips, updated regularly.' },
    { slug: 'mistress', label: 'Mistress', blurb: 'Browse Mistress videos and clips, updated regularly.' },
    { slug: 'mom', label: 'Mom', blurb: 'Browse Mom videos and clips, updated regularly.' },
    { slug: 'monster-cock', label: 'Monster Cock', blurb: 'Browse Monster Cock videos and clips, updated regularly.' },
    { slug: 'natural-boobs', label: 'Natural Boobs', blurb: 'Browse Natural Boobs videos and clips, updated regularly.' },
    { slug: 'naughty', label: 'Naughty', blurb: 'Browse Naughty videos and clips, updated regularly.' },
    { slug: 'neighbor', label: 'Neighbor', blurb: 'Browse Neighbor videos and clips, updated regularly.' },
    { slug: 'nerdy', label: 'Nerdy', blurb: 'Browse Nerdy videos and clips, updated regularly.' },
    { slug: 'nipples', label: 'Nipples', blurb: 'Browse Nipples videos and clips, updated regularly.' },
    { slug: 'nun', label: 'Nun', blurb: 'Browse Nun videos and clips, updated regularly.' },
    { slug: 'nurse', label: 'Nurse', blurb: 'Browse Nurse videos and clips, updated regularly.' },
    { slug: 'nylon', label: 'Nylon', blurb: 'Browse Nylon videos and clips, updated regularly.' },
    { slug: 'nympho', label: 'Nympho', blurb: 'Browse Nympho videos and clips, updated regularly.' },
    { slug: 'office', label: 'Office', blurb: 'Browse Office videos and clips, updated regularly.' },
    { slug: 'oil', label: 'Oil', blurb: 'Browse Oil videos and clips, updated regularly.' },
    { slug: 'old-and-young-18', label: 'Old And Young (18+)', blurb: 'Browse Old And Young (18+) videos and clips, updated regularly.' },
    { slug: 'old-man', label: 'Old Man', blurb: 'Browse Old Man videos and clips, updated regularly.' },
    { slug: 'orgasm', label: 'Orgasm', blurb: 'Browse Orgasm videos and clips, updated regularly.' },
    { slug: 'orgy', label: 'Orgy', blurb: 'Browse Orgy videos and clips, updated regularly.' },
    { slug: 'outdoor', label: 'Outdoor', blurb: 'Browse Outdoor videos and clips, updated regularly.' },
    { slug: 'pain', label: 'Pain', blurb: 'Browse Pain videos and clips, updated regularly.' },
    { slug: 'panties', label: 'Panties', blurb: 'Browse Panties videos and clips, updated regularly.' },
    { slug: 'pantyhose', label: 'Pantyhose', blurb: 'Browse Pantyhose videos and clips, updated regularly.' },
    { slug: 'parody', label: 'Parody', blurb: 'Browse Parody videos and clips, updated regularly.' },
    { slug: 'party', label: 'Party', blurb: 'Browse Party videos and clips, updated regularly.' },
    { slug: 'pawg', label: 'PAWG', blurb: 'Browse PAWG videos and clips, updated regularly.' },
    { slug: 'petite', label: 'Petite', blurb: 'Browse Petite videos and clips, updated regularly.' },
    { slug: 'pick-up', label: 'Pick Up', blurb: 'Browse Pick Up videos and clips, updated regularly.' },
    { slug: 'piercing', label: 'Piercing', blurb: 'Browse Piercing videos and clips, updated regularly.' },
    { slug: 'pigtail', label: 'Pigtail', blurb: 'Browse Pigtail videos and clips, updated regularly.' },
    { slug: 'pissing', label: 'Pissing', blurb: 'Browse Pissing videos and clips, updated regularly.' },
    { slug: 'police', label: 'Police', blurb: 'Browse Police videos and clips, updated regularly.' },
    { slug: 'pool', label: 'Pool', blurb: 'Browse Pool videos and clips, updated regularly.' },
    { slug: 'pornstars', label: 'Pornstars', blurb: 'Browse Pornstars videos and clips, updated regularly.' },
    { slug: 'pov', label: 'POV', blurb: 'Browse POV videos and clips, updated regularly.' },
    { slug: 'pregnant', label: 'Pregnant', blurb: 'Browse Pregnant videos and clips, updated regularly.' },
    { slug: 'pretty', label: 'Pretty', blurb: 'Browse Pretty videos and clips, updated regularly.' },
    { slug: 'public', label: 'Public', blurb: 'Browse Public videos and clips, updated regularly.' },
    { slug: 'punishment', label: 'Punishment', blurb: 'Browse Punishment videos and clips, updated regularly.' },
    { slug: 'punk', label: 'Punk', blurb: 'Browse Punk videos and clips, updated regularly.' },
    { slug: 'pussy-licking', label: 'Pussy Licking', blurb: 'Browse Pussy Licking videos and clips, updated regularly.' },
    { slug: 'reality', label: 'Reality', blurb: 'Browse Reality videos and clips, updated regularly.' },
    { slug: 'redhead', label: 'Redhead', blurb: 'Browse Redhead videos and clips, updated regularly.' },
    { slug: 'reverse-cowgirl', label: 'Reverse Cowgirl', blurb: 'Browse Reverse Cowgirl videos and clips, updated regularly.' },
    { slug: 'riding', label: 'Riding', blurb: 'Browse Riding videos and clips, updated regularly.' },
    { slug: 'rimjob', label: 'Rimjob', blurb: 'Browse Rimjob videos and clips, updated regularly.' },
    { slug: 'roleplay', label: 'Roleplay', blurb: 'Browse Roleplay videos and clips, updated regularly.' },
    { slug: 'romantic', label: 'Romantic', blurb: 'Browse Romantic videos and clips, updated regularly.' },
    { slug: 'rough', label: 'Rough', blurb: 'Browse Rough videos and clips, updated regularly.' },
    { slug: 'russian', label: 'Russian', blurb: 'Browse Russian videos and clips, updated regularly.', country: true },
    { slug: 'saggy-boobs', label: 'Saggy Boobs', blurb: 'Browse Saggy Boobs videos and clips, updated regularly.' },
    { slug: 'satin', label: 'Satin', blurb: 'Browse Satin videos and clips, updated regularly.' },
    { slug: 'sauna', label: 'Sauna', blurb: 'Browse Sauna videos and clips, updated regularly.' },
    { slug: 'schoolgirl', label: 'Schoolgirl', blurb: 'Browse Schoolgirl videos and clips, updated regularly.' },
    { slug: 'secretary', label: 'Secretary', blurb: 'Browse Secretary videos and clips, updated regularly.' },
    { slug: 'sensual', label: 'Sensual', blurb: 'Browse Sensual videos and clips, updated regularly.' },
    { slug: 'shaved-pussy', label: 'Shaved Pussy', blurb: 'Browse Shaved Pussy videos and clips, updated regularly.' },
    { slug: 'short-hair', label: 'Short Hair', blurb: 'Browse Short Hair videos and clips, updated regularly.' },
    { slug: 'shower', label: 'Shower', blurb: 'Browse Shower videos and clips, updated regularly.' },
    { slug: 'sister', label: 'Sister', blurb: 'Browse Sister videos and clips, updated regularly.' },
    { slug: 'skinny', label: 'Skinny', blurb: 'Browse Skinny videos and clips, updated regularly.' },
    { slug: 'slave', label: 'Slave', blurb: 'Browse Slave videos and clips, updated regularly.' },
    { slug: 'slut', label: 'Slut', blurb: 'Browse Slut videos and clips, updated regularly.' },
    { slug: 'small-tits', label: 'Small Tits', blurb: 'Browse Small Tits videos and clips, updated regularly.' },
    { slug: 'smoking', label: 'Smoking', blurb: 'Browse Smoking videos and clips, updated regularly.' },
    { slug: 'softcore', label: 'Softcore', blurb: 'Browse Softcore videos and clips, updated regularly.' },
    { slug: 'solo', label: 'Solo', blurb: 'Browse Solo videos and clips, updated regularly.' },
    { slug: 'spandex', label: 'Spandex', blurb: 'Browse Spandex videos and clips, updated regularly.' },
    { slug: 'spanish', label: 'Spanish', blurb: 'Browse Spanish videos and clips, updated regularly.', country: true },
    { slug: 'spanking', label: 'Spanking', blurb: 'Browse Spanking videos and clips, updated regularly.' },
    { slug: 'sport', label: 'Sport', blurb: 'Browse Sport videos and clips, updated regularly.' },
    { slug: 'spy', label: 'Spy', blurb: 'Browse Spy videos and clips, updated regularly.' },
    { slug: 'squirt', label: 'Squirt', blurb: 'Browse Squirt videos and clips, updated regularly.' },
    { slug: 'stepmom', label: 'Stepmom', blurb: 'Browse Stepmom videos and clips, updated regularly.' },
    { slug: 'stepsister', label: 'Stepsister', blurb: 'Browse Stepsister videos and clips, updated regularly.' },
    { slug: 'stewardess', label: 'Stewardess', blurb: 'Browse Stewardess videos and clips, updated regularly.' },
    { slug: 'stockings', label: 'Stockings', blurb: 'Browse Stockings videos and clips, updated regularly.' },
    { slug: 'strap-on', label: 'Strap-on', blurb: 'Browse Strap-on videos and clips, updated regularly.' },
    { slug: 'striptease', label: 'Striptease', blurb: 'Browse Striptease videos and clips, updated regularly.' },
    { slug: 'students', label: 'Students', blurb: 'Browse Students videos and clips, updated regularly.' },
    { slug: 'submissive', label: 'Submissive', blurb: 'Browse Submissive videos and clips, updated regularly.' },
    { slug: 'swallowing', label: 'Swallowing', blurb: 'Browse Swallowing videos and clips, updated regularly.' },
    { slug: 'swingers', label: 'Swingers', blurb: 'Browse Swingers videos and clips, updated regularly.' },
    { slug: 'sybian', label: 'Sybian', blurb: 'Browse Sybian videos and clips, updated regularly.' },
    { slug: 'table', label: 'Table', blurb: 'Browse Table videos and clips, updated regularly.' },
    { slug: 'taboo', label: 'Taboo', blurb: 'Browse Taboo videos and clips, updated regularly.' },
    { slug: 'tanned', label: 'Tanned', blurb: 'Browse Tanned videos and clips, updated regularly.' },
    { slug: 'tattooed', label: 'Tattooed', blurb: 'Browse Tattooed videos and clips, updated regularly.' },
    { slug: 'taxi', label: 'Taxi', blurb: 'Browse Taxi videos and clips, updated regularly.' },
    { slug: 'teacher', label: 'Teacher', blurb: 'Browse Teacher videos and clips, updated regularly.' },
    { slug: 'teasing', label: 'Teasing', blurb: 'Browse Teasing videos and clips, updated regularly.' },
    { slug: 'teen', label: 'Teen', blurb: 'Browse Teen videos and clips, updated regularly.' },
    { slug: 'thai', label: 'Thai', blurb: 'Browse Thai videos and clips, updated regularly.', country: true },
    { slug: 'threesome', label: 'Threesome', blurb: 'Browse Threesome videos and clips, updated regularly.' },
    { slug: 'throat-fucked', label: 'Throat Fucked', blurb: 'Browse Throat Fucked videos and clips, updated regularly.' },
    { slug: 'tied', label: 'Tied', blurb: 'Browse Tied videos and clips, updated regularly.' },
    { slug: 'titty-fuck', label: 'Titty Fuck', blurb: 'Browse Titty Fuck videos and clips, updated regularly.' },
    { slug: 'toilet', label: 'Toilet', blurb: 'Browse Toilet videos and clips, updated regularly.' },
    { slug: 'toys', label: 'Toys', blurb: 'Browse Toys videos and clips, updated regularly.' },
    { slug: 'trimmed-pussy', label: 'Trimmed Pussy', blurb: 'Browse Trimmed Pussy videos and clips, updated regularly.' },
    { slug: 'turkish', label: 'Turkish', blurb: 'Browse Turkish videos and clips, updated regularly.', country: true },
    { slug: 'uncensored', label: 'Uncensored', blurb: 'Browse Uncensored videos and clips, updated regularly.' },
    { slug: 'undressing', label: 'Undressing', blurb: 'Browse Undressing videos and clips, updated regularly.' },
    { slug: 'uniform', label: 'Uniform', blurb: 'Browse Uniform videos and clips, updated regularly.' },
    { slug: 'upskirt', label: 'Upskirt', blurb: 'Browse Upskirt videos and clips, updated regularly.' },
    { slug: 'vibrator', label: 'Vibrator', blurb: 'Browse Vibrator videos and clips, updated regularly.' },
    { slug: 'vintage', label: 'Vintage', blurb: 'Browse Vintage videos and clips, updated regularly.' },
    { slug: 'voyeur', label: 'Voyeur', blurb: 'Browse Voyeur videos and clips, updated regularly.' },
    { slug: 'webcam', label: 'Webcam', blurb: 'Browse Webcam videos and clips, updated regularly.' },
    { slug: 'wife', label: 'Wife', blurb: 'Browse Wife videos and clips, updated regularly.' },
    { slug: 'wild', label: 'Wild', blurb: 'Browse Wild videos and clips, updated regularly.' },
    { slug: 'wrestling', label: 'Wrestling', blurb: 'Browse Wrestling videos and clips, updated regularly.' },
    { slug: 'yoga', label: 'Yoga', blurb: 'Browse Yoga videos and clips, updated regularly.' },
    { slug: 'desi', label: 'desi', blurb: 'Browse desi videos and clips, updated regularly.', country: true },
    { slug: 'desi-webseries', label: 'desi webseries', blurb: 'Browse desi webseries videos and clips, updated regularly.' },
    { slug: 'sneaky', label: 'sneaky', blurb: 'Browse sneaky videos and clips, updated regularly.' },
    { slug: 'boob-show', label: 'boob show', blurb: 'Browse boob show videos and clips, updated regularly.' },
    { slug: 'boob', label: 'boob', blurb: 'Browse boob videos and clips, updated regularly.' },
    { slug: 'kiss', label: 'kiss', blurb: 'Browse kiss videos and clips, updated regularly.' },
    { slug: 'smooch', label: 'smooch', blurb: 'Browse smooch videos and clips, updated regularly.' },
];

const COUNTRIES = CATEGORIES.filter(c => c.country === true);

const PERFORMERS = [
    { slug: 'dani-daniels', label: 'Dani Daniels', blurb: 'Scenes and clips featuring Dani Daniels.' },
    { slug: 'johnny-sins', label: 'Johnny Sins', blurb: 'Scenes and clips featuring Johnny Sins.' },
    { slug: 'danny-d', label: 'Danny D', blurb: 'Scenes and clips featuring Danny D.' },
    { slug: 'angela-white', label: 'Angela White', blurb: 'Scenes and clips featuring Angela White.' },
    { slug: 'mia-khalifa', label: 'Mia Khalifa', blurb: 'Scenes and clips featuring Mia Khalifa.' },
    { slug: 'ava-addams', label: 'Ava Addams', blurb: 'Scenes and clips featuring Ava Addams.' },
    { slug: 'alison-tyler', label: 'Alison Tyler', blurb: 'Scenes and clips featuring Alison Tyler.' },
    { slug: 'sunny-leone', label: 'Sunny Leone', blurb: 'Scenes and clips featuring Sunny Leone.' },
    { slug: 'ariella-ferrera', label: 'Ariella Ferrera', blurb: 'Scenes and clips featuring Ariella Ferrera.' },
    { slug: 'nicolette-shea', label: 'Nicolette Shea', blurb: 'Scenes and clips featuring Nicolette Shea.' },
    { slug: 'nicole-aniston', label: 'Nicole Aniston', blurb: 'Scenes and clips featuring Nicole Aniston.' },
    { slug: 'jasmine-jae', label: 'Jasmine Jae', blurb: 'Scenes and clips featuring Jasmine Jae.' },
    { slug: 'sophia-leone', label: 'Sophia Leone', blurb: 'Scenes and clips featuring Sophia Leone.' },
    { slug: 'kendra-lust', label: 'Kendra Lust', blurb: 'Scenes and clips featuring Kendra Lust.' },
    { slug: 'keiran-lee', label: 'Keiran Lee', blurb: 'Scenes and clips featuring Keiran Lee.' },
    { slug: 'valentina-nappi', label: 'Valentina Nappi', blurb: 'Scenes and clips featuring Valentina Nappi.' },
    { slug: 'priya-rai', label: 'Priya Rai', blurb: 'Scenes and clips featuring Priya Rai.' },
    { slug: 'romi-rain', label: 'Romi Rain', blurb: 'Scenes and clips featuring Romi Rain.' },
    { slug: 'lana-rhoades', label: 'Lana Rhoades', blurb: 'Scenes and clips featuring Lana Rhoades.' },
    { slug: 'cathy-heaven', label: 'Cathy Heaven', blurb: 'Scenes and clips featuring Cathy Heaven.' },
    { slug: 'mia-malkova', label: 'Mia Malkova', blurb: 'Scenes and clips featuring Mia Malkova.' },
    { slug: 'lela-star', label: 'Lela Star', blurb: 'Scenes and clips featuring Lela Star.' },
    { slug: 'julia-ann', label: 'Julia Ann', blurb: 'Scenes and clips featuring Julia Ann.' },
    { slug: 'alura-jenson', label: 'Alura Jenson', blurb: 'Scenes and clips featuring Alura Jenson.' },
    { slug: 'lisa-ann', label: 'Lisa Ann', blurb: 'Scenes and clips featuring Lisa Ann.' },
    { slug: 'aletta-ocean', label: 'Aletta Ocean', blurb: 'Scenes and clips featuring Aletta Ocean.' },
    { slug: 'chanel-preston', label: 'Chanel Preston', blurb: 'Scenes and clips featuring Chanel Preston.' },
    { slug: 'nina-elle', label: 'Nina Elle', blurb: 'Scenes and clips featuring Nina Elle.' },
    { slug: 'xander-corvus', label: 'Xander Corvus', blurb: 'Scenes and clips featuring Xander Corvus.' },
    { slug: 'kiara-mia', label: 'Kiara Mia', blurb: 'Scenes and clips featuring Kiara Mia.' },
    { slug: 'gia-derza', label: 'Gia Derza', blurb: 'Scenes and clips featuring Gia Derza.' },
    { slug: 'anissa-kate', label: 'Anissa Kate', blurb: 'Scenes and clips featuring Anissa Kate.' },
    { slug: 'karlee-grey', label: 'Karlee Grey', blurb: 'Scenes and clips featuring Karlee Grey.' },
    { slug: 'ella-knox', label: 'Ella Knox', blurb: 'Scenes and clips featuring Ella Knox.' },
    { slug: 'eva-notty', label: 'Eva Notty', blurb: 'Scenes and clips featuring Eva Notty.' },
    { slug: 'blair-williams', label: 'Blair Williams', blurb: 'Scenes and clips featuring Blair Williams.' },
    { slug: 'eliza-ibarra', label: 'Eliza Ibarra', blurb: 'Scenes and clips featuring Eliza Ibarra.' },
    { slug: 'august-ames', label: 'August Ames', blurb: 'Scenes and clips featuring August Ames.' },
    { slug: 'ryan-conner', label: 'Ryan Conner', blurb: 'Scenes and clips featuring Ryan Conner.' },
    { slug: 'nikki-benz', label: 'Nikki Benz', blurb: 'Scenes and clips featuring Nikki Benz.' },
    { slug: 'abella-danger', label: 'Abella Danger', blurb: 'Scenes and clips featuring Abella Danger.' },
    { slug: 'katrina-jade', label: 'Katrina Jade', blurb: 'Scenes and clips featuring Katrina Jade.' },
    { slug: 'cory-chase', label: 'Cory Chase', blurb: 'Scenes and clips featuring Cory Chase.' },
    { slug: 'kissa-sins', label: 'Kissa Sins', blurb: 'Scenes and clips featuring Kissa Sins.' },
    { slug: 'alina-lopez', label: 'Alina Lopez', blurb: 'Scenes and clips featuring Alina Lopez.' },
    { slug: 'brandi-love', label: 'Brandi Love', blurb: 'Scenes and clips featuring Brandi Love.' },
    { slug: 'manuel-ferrara', label: 'Manuel Ferrara', blurb: 'Scenes and clips featuring Manuel Ferrara.' },
    { slug: 'skyla-novea', label: 'Skyla Novea', blurb: 'Scenes and clips featuring Skyla Novea.' },
    { slug: 'richelle-ryan', label: 'Richelle Ryan', blurb: 'Scenes and clips featuring Richelle Ryan.' },
    { slug: 'tommy-gunn', label: 'Tommy Gunn', blurb: 'Scenes and clips featuring Tommy Gunn.' },
    { slug: 'rose-monroe', label: 'Rose Monroe', blurb: 'Scenes and clips featuring Rose Monroe.' },
    { slug: 'alexis-texas', label: 'Alexis Texas', blurb: 'Scenes and clips featuring Alexis Texas.' },
    { slug: 'sophie-dee', label: 'Sophie Dee', blurb: 'Scenes and clips featuring Sophie Dee.' },
    { slug: 'keisha-grey', label: 'Keisha Grey', blurb: 'Scenes and clips featuring Keisha Grey.' },
    { slug: 'susy-gala', label: 'Susy Gala', blurb: 'Scenes and clips featuring Susy Gala.' },
    { slug: 'eva-lovia', label: 'Eva Lovia', blurb: 'Scenes and clips featuring Eva Lovia.' },
    { slug: 'natalia-starr', label: 'Natalia Starr', blurb: 'Scenes and clips featuring Natalia Starr.' },
    { slug: 'brooklyn-chase', label: 'Brooklyn Chase', blurb: 'Scenes and clips featuring Brooklyn Chase.' },
    { slug: 'eva-berger', label: 'Eva Berger', blurb: 'Scenes and clips featuring Eva Berger.' },
    { slug: 'tyler-nixon', label: 'Tyler Nixon', blurb: 'Scenes and clips featuring Tyler Nixon.' },
    { slug: 'tori-black', label: 'Tori Black', blurb: 'Scenes and clips featuring Tori Black.' },
    { slug: 'jessa-rhodes', label: 'Jessa Rhodes', blurb: 'Scenes and clips featuring Jessa Rhodes.' },
    { slug: 'madison-ivy', label: 'Madison Ivy', blurb: 'Scenes and clips featuring Madison Ivy.' },
    { slug: 'ashly-anderson', label: 'Ashly Anderson', blurb: 'Scenes and clips featuring Ashly Anderson.' },
    { slug: 'mercedes-carrera', label: 'Mercedes Carrera', blurb: 'Scenes and clips featuring Mercedes Carrera.' },
    { slug: 'ariana-marie', label: 'Ariana Marie', blurb: 'Scenes and clips featuring Ariana Marie.' },
    { slug: 'megan-sage', label: 'Megan Sage', blurb: 'Scenes and clips featuring Megan Sage.' },
    { slug: 'bridgette-b', label: 'Bridgette B', blurb: 'Scenes and clips featuring Bridgette B.' },
    { slug: 'august-taylor', label: 'August Taylor', blurb: 'Scenes and clips featuring August Taylor.' },
    { slug: 'cherie-deville', label: 'Cherie Deville', blurb: 'Scenes and clips featuring Cherie Deville.' },
    { slug: 'lucy-li', label: 'Lucy Li', blurb: 'Scenes and clips featuring Lucy Li.' },
    { slug: 'amirah-adara', label: 'Amirah Adara', blurb: 'Scenes and clips featuring Amirah Adara.' },
    { slug: 'victoria-june', label: 'Victoria June', blurb: 'Scenes and clips featuring Victoria June.' },
    { slug: 'angel-wicky', label: 'Angel Wicky', blurb: 'Scenes and clips featuring Angel Wicky.' },
    { slug: 'india-summer', label: 'India Summer', blurb: 'Scenes and clips featuring India Summer.' },
    { slug: 'alexis-fawx', label: 'Alexis Fawx', blurb: 'Scenes and clips featuring Alexis Fawx.' },
    { slug: 'alexa-grace', label: 'Alexa Grace', blurb: 'Scenes and clips featuring Alexa Grace.' },
    { slug: 'leah-gotti', label: 'Leah Gotti', blurb: 'Scenes and clips featuring Leah Gotti.' },
    { slug: 'riley-reid', label: 'Riley Reid', blurb: 'Scenes and clips featuring Riley Reid.' },
    { slug: 'natasha-nice', label: 'Natasha Nice', blurb: 'Scenes and clips featuring Natasha Nice.' },
    { slug: 'aj-applegate', label: 'Aj Applegate', blurb: 'Scenes and clips featuring Aj Applegate.' },
    { slug: 'adria-rae', label: 'Adria Rae', blurb: 'Scenes and clips featuring Adria Rae.' },
    { slug: 'abigail-mac', label: 'Abigail Mac', blurb: 'Scenes and clips featuring Abigail Mac.' },
    { slug: 'emily-willis', label: 'Emily Willis', blurb: 'Scenes and clips featuring Emily Willis.' },
    { slug: 'adriana-chechik', label: 'Adriana Chechik', blurb: 'Scenes and clips featuring Adriana Chechik.' },
    { slug: 'johnny-castle', label: 'Johnny Castle', blurb: 'Scenes and clips featuring Johnny Castle.' },
    { slug: 'veronica-avluv', label: 'Veronica Avluv', blurb: 'Scenes and clips featuring Veronica Avluv.' },
    { slug: 'alex-legend', label: 'Alex Legend', blurb: 'Scenes and clips featuring Alex Legend.' },
    { slug: 'harmony-reigns', label: 'Harmony Reigns', blurb: 'Scenes and clips featuring Harmony Reigns.' },
    { slug: 'peta-jensen', label: 'Peta Jensen', blurb: 'Scenes and clips featuring Peta Jensen.' },
    { slug: 'isis-love', label: 'Isis Love', blurb: 'Scenes and clips featuring Isis Love.' },
    { slug: 'charles-dera', label: 'Charles Dera', blurb: 'Scenes and clips featuring Charles Dera.' },
    { slug: 'nadia-ali', label: 'Nadia Ali', blurb: 'Scenes and clips featuring Nadia Ali.' },
    { slug: 'phoenix-marie', label: 'Phoenix Marie', blurb: 'Scenes and clips featuring Phoenix Marie.' },
    { slug: 'penny-pax', label: 'Penny Pax', blurb: 'Scenes and clips featuring Penny Pax.' },
    { slug: 'cali-carter', label: 'Cali Carter', blurb: 'Scenes and clips featuring Cali Carter.' },
    { slug: 'missy-martinez', label: 'Missy Martinez', blurb: 'Scenes and clips featuring Missy Martinez.' },
    { slug: 'marina-visconti', label: 'Marina Visconti', blurb: 'Scenes and clips featuring Marina Visconti.' },
    { slug: 'lily-adams', label: 'Lily Adams', blurb: 'Scenes and clips featuring Lily Adams.' },
    { slug: 'jordan-pryce', label: 'Jordan Pryce', blurb: 'Scenes and clips featuring Jordan Pryce.' },
    { slug: 'lennox-luxe', label: 'Lennox Luxe', blurb: 'Scenes and clips featuring Lennox Luxe.' },
    { slug: 'sarah-vandella', label: 'Sarah Vandella', blurb: 'Scenes and clips featuring Sarah Vandella.' },
    { slug: 'whitney-wright', label: 'Whitney Wright', blurb: 'Scenes and clips featuring Whitney Wright.' },
    { slug: 'mandy-muse', label: 'Mandy Muse', blurb: 'Scenes and clips featuring Mandy Muse.' },
    { slug: 'bill-bailey', label: 'Bill Bailey', blurb: 'Scenes and clips featuring Bill Bailey.' },
    { slug: 'sara-jay', label: 'Sara Jay', blurb: 'Scenes and clips featuring Sara Jay.' },
    { slug: 'zoey-monroe', label: 'Zoey Monroe', blurb: 'Scenes and clips featuring Zoey Monroe.' },
    { slug: 'shyla-stylez', label: 'Shyla Stylez', blurb: 'Scenes and clips featuring Shyla Stylez.' },
    { slug: 'lauren-phillips', label: 'Lauren Phillips', blurb: 'Scenes and clips featuring Lauren Phillips.' },
    { slug: 'lucas-frost', label: 'Lucas Frost', blurb: 'Scenes and clips featuring Lucas Frost.' },
    { slug: 'kristen-scott', label: 'Kristen Scott', blurb: 'Scenes and clips featuring Kristen Scott.' },
    { slug: 'casey-calvert', label: 'Casey Calvert', blurb: 'Scenes and clips featuring Casey Calvert.' },
    { slug: 'kira-noir', label: 'Kira Noir', blurb: 'Scenes and clips featuring Kira Noir.' },
    { slug: 'peter-green', label: 'Peter Green', blurb: 'Scenes and clips featuring Peter Green.' },
    { slug: 'georgie-lyall', label: 'Georgie Lyall', blurb: 'Scenes and clips featuring Georgie Lyall.' },
    { slug: 'asa-akira', label: 'Asa Akira', blurb: 'Scenes and clips featuring Asa Akira.' },
    { slug: 'mila-marx', label: 'Mila Marx', blurb: 'Scenes and clips featuring Mila Marx.' },
    { slug: 'cassidy-klein', label: 'Cassidy Klein', blurb: 'Scenes and clips featuring Cassidy Klein.' },
    { slug: 'rocco-siffredi', label: 'Rocco Siffredi', blurb: 'Scenes and clips featuring Rocco Siffredi.' },
    { slug: 'elsa-jean', label: 'Elsa Jean', blurb: 'Scenes and clips featuring Elsa Jean.' },
    { slug: 'sheena-ryder', label: 'Sheena Ryder', blurb: 'Scenes and clips featuring Sheena Ryder.' },
    { slug: 'audrey-bitoni', label: 'Audrey Bitoni', blurb: 'Scenes and clips featuring Audrey Bitoni.' },
    { slug: 'reagan-foxx', label: 'Reagan Foxx', blurb: 'Scenes and clips featuring Reagan Foxx.' },
    { slug: 'jennifer-white', label: 'Jennifer White', blurb: 'Scenes and clips featuring Jennifer White.' },
    { slug: 'stella-cox', label: 'Stella Cox', blurb: 'Scenes and clips featuring Stella Cox.' },
    { slug: 'kylie-page', label: 'Kylie Page', blurb: 'Scenes and clips featuring Kylie Page.' },
    { slug: 'lena-paul', label: 'Lena Paul', blurb: 'Scenes and clips featuring Lena Paul.' },
    { slug: 'megan-salinas', label: 'Megan Salinas', blurb: 'Scenes and clips featuring Megan Salinas.' },
    { slug: 'juan-el-caballo-loco', label: 'Juan El Caballo Loco', blurb: 'Scenes and clips featuring Juan El Caballo Loco.' },
    { slug: 'luna-star', label: 'Luna Star', blurb: 'Scenes and clips featuring Luna Star.' },
    { slug: 'sofie-reyez', label: 'Sofie Reyez', blurb: 'Scenes and clips featuring Sofie Reyez.' },
    { slug: 'nina-kayy', label: 'Nina Kayy', blurb: 'Scenes and clips featuring Nina Kayy.' },
    { slug: 'diamond-jackson', label: 'Diamond Jackson', blurb: 'Scenes and clips featuring Diamond Jackson.' },
    { slug: 'gia-paige', label: 'Gia Paige', blurb: 'Scenes and clips featuring Gia Paige.' },
    { slug: 'angelina-castro', label: 'Angelina Castro', blurb: 'Scenes and clips featuring Angelina Castro.' },
    { slug: 'avi-love', label: 'Avi Love', blurb: 'Scenes and clips featuring Avi Love.' },
    { slug: 'katana-kombat', label: 'Katana Kombat', blurb: 'Scenes and clips featuring Katana Kombat.' },
    { slug: 'gina-valentina', label: 'Gina Valentina', blurb: 'Scenes and clips featuring Gina Valentina.' },
    { slug: 'sean-lawless', label: 'Sean Lawless', blurb: 'Scenes and clips featuring Sean Lawless.' },
    { slug: 'anastasia-lux', label: 'Anastasia Lux', blurb: 'Scenes and clips featuring Anastasia Lux.' },
    { slug: 'veronica-rodriguez', label: 'Veronica Rodriguez', blurb: 'Scenes and clips featuring Veronica Rodriguez.' },
    { slug: 'aaliyah-hadid', label: 'Aaliyah Hadid', blurb: 'Scenes and clips featuring Aaliyah Hadid.' },
    { slug: 'ryan-madison', label: 'Ryan Madison', blurb: 'Scenes and clips featuring Ryan Madison.' },
    { slug: 'veronica-vain', label: 'Veronica Vain', blurb: 'Scenes and clips featuring Veronica Vain.' },
    { slug: 'jynx-maze', label: 'Jynx Maze', blurb: 'Scenes and clips featuring Jynx Maze.' },
    { slug: 'dayna-vendetta', label: 'Dayna Vendetta', blurb: 'Scenes and clips featuring Dayna Vendetta.' },
    { slug: 'ada-sanchez', label: 'Ada Sanchez', blurb: 'Scenes and clips featuring Ada Sanchez.' },
    { slug: 'janice-griffith', label: 'Janice Griffith', blurb: 'Scenes and clips featuring Janice Griffith.' },
    { slug: 'sybil-stallone', label: 'Sybil Stallone', blurb: 'Scenes and clips featuring Sybil Stallone.' },
    { slug: 'markus-dupree', label: 'Markus Dupree', blurb: 'Scenes and clips featuring Markus Dupree.' },
    { slug: 'jessy-jones', label: 'Jessy Jones', blurb: 'Scenes and clips featuring Jessy Jones.' },
    { slug: 'noelle-easton', label: 'Noelle Easton', blurb: 'Scenes and clips featuring Noelle Easton.' },
    { slug: 'jayden-jaymes', label: 'Jayden Jaymes', blurb: 'Scenes and clips featuring Jayden Jaymes.' },
    { slug: 'kenna-james', label: 'Kenna James', blurb: 'Scenes and clips featuring Kenna James.' },
    { slug: 'mick-blue', label: 'Mick Blue', blurb: 'Scenes and clips featuring Mick Blue.' },
    { slug: 'jaclyn-taylor', label: 'Jaclyn Taylor', blurb: 'Scenes and clips featuring Jaclyn Taylor.' },
    { slug: 'jenna-foxx', label: 'Jenna Foxx', blurb: 'Scenes and clips featuring Jenna Foxx.' },
    { slug: 'evelina-darling', label: 'Evelina Darling', blurb: 'Scenes and clips featuring Evelina Darling.' },
    { slug: 'alena-croft', label: 'Alena Croft', blurb: 'Scenes and clips featuring Alena Croft.' },
    { slug: 'cassidy-banks', label: 'Cassidy Banks', blurb: 'Scenes and clips featuring Cassidy Banks.' },
    { slug: 'diamond-kitty', label: 'Diamond Kitty', blurb: 'Scenes and clips featuring Diamond Kitty.' },
    { slug: 'tina-kay', label: 'Tina Kay', blurb: 'Scenes and clips featuring Tina Kay.' },
    { slug: 'karma-rx', label: 'Karma Rx', blurb: 'Scenes and clips featuring Karma Rx.' },
    { slug: 'violet-starr', label: 'Violet Starr', blurb: 'Scenes and clips featuring Violet Starr.' },
    { slug: 'rachel-starr', label: 'Rachel Starr', blurb: 'Scenes and clips featuring Rachel Starr.' },
    { slug: 'krissy-lynn', label: 'Krissy Lynn', blurb: 'Scenes and clips featuring Krissy Lynn.' },
    { slug: 'karmen-karma', label: 'Karmen Karma', blurb: 'Scenes and clips featuring Karmen Karma.' },
    { slug: 'kristof-cale', label: 'Kristof Cale', blurb: 'Scenes and clips featuring Kristof Cale.' },
    { slug: 'britney-amber', label: 'Britney Amber', blurb: 'Scenes and clips featuring Britney Amber.' },
    { slug: 'monique-alexander', label: 'Monique Alexander', blurb: 'Scenes and clips featuring Monique Alexander.' },
    { slug: 'amy-anderssen', label: 'Amy Anderssen', blurb: 'Scenes and clips featuring Amy Anderssen.' },
    { slug: 'kimmy-granger', label: 'Kimmy Granger', blurb: 'Scenes and clips featuring Kimmy Granger.' },
    { slug: 'karla-kush', label: 'Karla Kush', blurb: 'Scenes and clips featuring Karla Kush.' },
    { slug: 'audrey-royal', label: 'Audrey Royal', blurb: 'Scenes and clips featuring Audrey Royal.' },
    { slug: 'brenna-sparks', label: 'Brenna Sparks', blurb: 'Scenes and clips featuring Brenna Sparks.' },
    { slug: 'nickey-huntsman', label: 'Nickey Huntsman', blurb: 'Scenes and clips featuring Nickey Huntsman.' },
    { slug: 'james-deen', label: 'James Deen', blurb: 'Scenes and clips featuring James Deen.' },
    { slug: 'anissa-jolie', label: 'Anissa Jolie', blurb: 'Scenes and clips featuring Anissa Jolie.' },
    { slug: 'bruce-venture', label: 'Bruce Venture', blurb: 'Scenes and clips featuring Bruce Venture.' },
    { slug: 'karen-fisher', label: 'Karen Fisher', blurb: 'Scenes and clips featuring Karen Fisher.' },
    { slug: 'brandi-bae', label: 'Brandi Bae', blurb: 'Scenes and clips featuring Brandi Bae.' },
    { slug: 'allie-haze', label: 'Allie Haze', blurb: 'Scenes and clips featuring Allie Haze.' },
    { slug: 'kitty-jane', label: 'Kitty Jane', blurb: 'Scenes and clips featuring Kitty Jane.' },
    { slug: 'jasmine-black', label: 'Jasmine Black', blurb: 'Scenes and clips featuring Jasmine Black.' },
    { slug: 'ramon-nomar', label: 'Ramon Nomar', blurb: 'Scenes and clips featuring Ramon Nomar.' },
    { slug: 'kagney-linn', label: 'Kagney Linn', blurb: 'Scenes and clips featuring Kagney Linn.' },
    { slug: 'danni-rivers', label: 'Danni Rivers', blurb: 'Scenes and clips featuring Danni Rivers.' },
    { slug: 'julianna-vega', label: 'Julianna Vega', blurb: 'Scenes and clips featuring Julianna Vega.' },
    { slug: 'sheridan-love', label: 'Sheridan Love', blurb: 'Scenes and clips featuring Sheridan Love.' },
    { slug: 'melissa-moore', label: 'Melissa Moore', blurb: 'Scenes and clips featuring Melissa Moore.' },
    { slug: 'elena-koshka', label: 'Elena Koshka', blurb: 'Scenes and clips featuring Elena Koshka.' },
    { slug: 'dillion-harper', label: 'Dillion Harper', blurb: 'Scenes and clips featuring Dillion Harper.' },
    { slug: 'kali-rose', label: 'Kali Rose', blurb: 'Scenes and clips featuring Kali Rose.' },
    { slug: 'vienna-black', label: 'Vienna Black', blurb: 'Scenes and clips featuring Vienna Black.' },
    { slug: 'jillian-janson', label: 'Jillian Janson', blurb: 'Scenes and clips featuring Jillian Janson.' },
    { slug: 'carolina-sweets', label: 'Carolina Sweets', blurb: 'Scenes and clips featuring Carolina Sweets.' },
    { slug: 'natasha-malkova', label: 'Natasha Malkova', blurb: 'Scenes and clips featuring Natasha Malkova.' },
    { slug: 'erik-everhard', label: 'Erik Everhard', blurb: 'Scenes and clips featuring Erik Everhard.' },
    { slug: 'kesha-ortega', label: 'Kesha Ortega', blurb: 'Scenes and clips featuring Kesha Ortega.' },
    { slug: 'bonnie-rotten', label: 'Bonnie Rotten', blurb: 'Scenes and clips featuring Bonnie Rotten.' },
    { slug: 'amber-jayne', label: 'Amber Jayne', blurb: 'Scenes and clips featuring Amber Jayne.' },
    { slug: 'lady-dee', label: 'Lady Dee', blurb: 'Scenes and clips featuring Lady Dee.' },
    { slug: 'seth-gamble', label: 'Seth Gamble', blurb: 'Scenes and clips featuring Seth Gamble.' },
    { slug: 'chad-white', label: 'Chad White', blurb: 'Scenes and clips featuring Chad White.' },
    { slug: 'ashley-adams', label: 'Ashley Adams', blurb: 'Scenes and clips featuring Ashley Adams.' },
    { slug: 'uma-jolie', label: 'Uma Jolie', blurb: 'Scenes and clips featuring Uma Jolie.' },
    { slug: 'ivy-lebelle', label: 'Ivy Lebelle', blurb: 'Scenes and clips featuring Ivy Lebelle.' },
    { slug: 'gina-gerson', label: 'Gina Gerson', blurb: 'Scenes and clips featuring Gina Gerson.' },
    { slug: 'piper-perri', label: 'Piper Perri', blurb: 'Scenes and clips featuring Piper Perri.' },
    { slug: 'dee-williams', label: 'Dee Williams', blurb: 'Scenes and clips featuring Dee Williams.' },
    { slug: 'daphne-rosen', label: 'Daphne Rosen', blurb: 'Scenes and clips featuring Daphne Rosen.' },
    { slug: 'nacho-vidal', label: 'Nacho Vidal', blurb: 'Scenes and clips featuring Nacho Vidal.' },
    { slug: 'moriah-mills', label: 'Moriah Mills', blurb: 'Scenes and clips featuring Moriah Mills.' },
    { slug: 'robby-echo', label: 'Robby Echo', blurb: 'Scenes and clips featuring Robby Echo.' },
    { slug: 'sofia-rose', label: 'Sofia Rose', blurb: 'Scenes and clips featuring Sofia Rose.' },
    { slug: 'aidra-fox', label: 'Aidra Fox', blurb: 'Scenes and clips featuring Aidra Fox.' },
];

function findBySlug(list, slug) {
    return list.find(c => c.slug === slug);
}

function toSlug(text) {
    return slugify(text, { lower: true, strict: true });
}

function fromSlug(slug) {
    return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function extractTopKeywords(videoArrays, limit = 60) {
    const counts = new Map();
    const allVideos = [].concat(...videoArrays);
    allVideos.forEach(v => {
        if (!v.keywords) return;
        v.keywords.split(',').forEach(raw => {
            const kw = raw.trim().toLowerCase();
            const wordCount = kw.split(/\s+/).length;
            if (kw.length < 2 || kw.length > 25 || wordCount > 3) return;
            counts.set(kw, (counts.get(kw) || 0) + 1);
        });
    });
    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([kw]) => kw);
}

const SORT_OPTIONS = [
    { value: 'top-weekly', label: 'Trending' },
    { value: 'top-rated', label: 'Top Rated' },
    { value: 'latest', label: 'Latest' },
];

function renderSortLinks(basePath, currentOrder) {
    return SORT_OPTIONS.map(opt => {
        const active = opt.value === currentOrder;
        const cls = active
            ? 'px-3 py-1 rounded bg-red-700 text-white text-xs font-bold'
            : 'px-3 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 text-xs hover:text-red-400';
        return `<a href="${basePath}?order=${opt.value}" class="${cls}">${opt.label}</a>`;
    }).join(' ');
}

function safeOrder(order) {
    return SORT_OPTIONS.some(o => o.value === order) ? order : 'top-weekly';
}

const PER_PAGE = 40;

function safePage(page) {
    const n = parseInt(page, 10);
    return Number.isInteger(n) && n > 0 ? n : 1;
}

function renderPagination(basePath, order, page, hasMore) {
    const qs = (p) => `?order=${order}&page=${p}`;
    const prev = page > 1
        ? `<a href="${basePath}${qs(page - 1)}" class="px-3 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 text-xs hover:text-red-400">← Prev</a>`
        : `<span class="px-3 py-1 rounded bg-slate-900/40 border border-slate-900 text-slate-400 text-xs">← Prev</span>`;
    const next = hasMore
        ? `<a href="${basePath}${qs(page + 1)}" class="px-3 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 text-xs hover:text-red-400">Next →</a>`
        : `<span class="px-3 py-1 rounded bg-slate-900/40 border border-slate-900 text-slate-400 text-xs">Next →</span>`;
    return `<div class="flex items-center justify-between mt-6"><span class="text-xs text-slate-400 font-mono">Page ${page}</span><div class="flex gap-2">${prev}${next}</div></div>`;
}

// -------------------------------------------------------------
// 2. SIMPLE IN-MEMORY CACHE
// -------------------------------------------------------------
const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

async function cachedGet(key, url) {
    const entry = cache.get(key);
    const now = Date.now();
    if (entry && now - entry.time < CACHE_TTL_MS) {
        return entry.data;
    }
    try {
        const res = await axios.get(url, { timeout: 8000 });
        cache.set(key, { data: res.data, time: now });
        return res.data;
    } catch (err) {
        if (entry) return entry.data;
        throw err;
    }
}

// -------------------------------------------------------------
// 3. AD PLACEMENTS & HTML SSR TEMPLATE
// -------------------------------------------------------------

// 1. Social Bar Site Script
const SOCIAL_BAR_SCRIPT = `<script src="https://supportiveinvoicevarnish.com/f0/10/13/f010135b24ae94e9bf9be88f3d51e2ed.js"></script>`;

// 2. Footer Banner Script
const FOOTER_AD_SCRIPT = `
<script>
atOptions = {
'key' : 'b881d4591dd8ea255cbc4e30c4506777',
'format' : 'iframe',
'height' : 250,
'width' : 300,
'params' : {}
};
</script>
<script src="https://supportiveinvoicevarnish.com/b881d4591dd8ea255cbc4e30c4506777/invoke.js"></script>
`;

// 3. Float Ad Player (JuicyAds)
const FLOAT_AD_PLAYER_SCRIPT = `
<!-- Start JuicyAds Float Ad -->
<script type="text/javascript">juicy_adzone = '1122725';</script>
<script type="text/javascript" src="https://poweredby.jads.co/js/jfc.js" charset="utf-8"></script>
<!-- End JuicyAds Float Ad -->
`;

// 4. Video Grid Bucket Ad (Injected every 5th video)
const EVERY_5TH_VIDEO_AD = `
<div class="col-span-1 min-h-[250px] flex flex-col items-center justify-center bg-slate-900/40 rounded-lg border border-slate-800 p-2">
    <script async="async" data-cfasync="false" src="https://supportiveinvoicevarnish.com/5de161d2a3fd4a9ee2823cd1195c61f7/invoke.js"></script>
    <div id="container-5de161d2a3fd4a9ee2823cd1195c61f7"></div>
</div>
`;

// 5. Page Header Video Ad
const HEADER_VIDEO_AD = `
<!-- JuicyAds v3.0 -->
<div class="w-full flex justify-center py-2 bg-slate-950">
    <script type="text/javascript" data-cfasync="false" async src="https://poweredby.jads.co/js/jads.js"></script>
    <ins id="1122723" data-width="300" data-height="100"></ins>
    <script type="text/javascript" data-cfasync="false" async>(adsbyjuicy = window.adsbyjuicy || []).push({'adzone':1122723});</script>
</div>
<!--JuicyAds END-->
`;

function renderHTMLPage({ title, description, keywords, canonicalPath, contentHtml, ogImage, jsonLd, robotsMeta }) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <meta name="google-site-verification" content="REPLACE_WITH_YOUR_GOOGLE_CODE">
    <meta name="msvalidate.01" content="REPLACE_WITH_YOUR_BING_CODE">
    <meta name="juicyads-site-verification" content="affadfd335bfb7c9a93b58524dc9904e">

    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta name="keywords" content="${keywords}">
    <meta name="robots" content="${robotsMeta || 'index, follow'}">
    <meta name="rating" content="adult">
    <meta name="rating" content="RTA-5042-1996-1400-1577-RTA">
    <link rel="canonical" href="${DOMAIN}${canonicalPath}">

    <meta property="og:type" content="website">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:url" content="${DOMAIN}${canonicalPath}">
    ${ogImage ? `<meta property="og:image" content="${ogImage}">` : ''}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">

    <link rel="stylesheet" href="/styles.css">
    ${HOVER_PREVIEW_SCRIPT}
    <style>
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    </style>
    ${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
    ${SOCIAL_BAR_SCRIPT}
</head>
<body class="bg-slate-950 text-slate-100 font-sans min-h-screen flex flex-col">
    <header class="bg-slate-900 border-b border-slate-800 p-3 sm:p-4 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <a href="/" class="text-xl sm:text-2xl font-black text-red-500 text-center sm:text-left">STREAM<span class="text-white">HUB</span>ELITE</a>

            <div class="flex gap-2 items-center w-full sm:w-auto">
                <form action="/search" method="GET" class="flex gap-2 flex-grow sm:flex-grow-0">
                    <input type="text" name="q" placeholder="Search keywords..." class="bg-slate-950 text-white px-3 py-2 sm:py-1 rounded border border-slate-800 text-sm flex-grow sm:flex-grow-0 sm:w-56">
                    <button type="submit" class="bg-red-700 px-4 py-2 sm:py-1 rounded text-sm font-bold whitespace-nowrap">Search</button>
                </form>
                <a href="/favorites" class="bg-slate-800 px-3 py-2 sm:py-1 rounded text-sm font-bold whitespace-nowrap border border-slate-700 hover:border-red-500">❤ <span id="favNavCount">0</span></a>
            </div>
        </div>
    </header>

    ${HEADER_VIDEO_AD}

    <main class="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8 flex-grow w-full">
        ${contentHtml}
    </main>

    <div class="w-full flex justify-center py-4 bg-slate-950 border-t border-slate-800">
        ${FOOTER_AD_SCRIPT}
    </div>

    <footer class="bg-slate-900 border-t border-slate-800 p-6 text-center text-xs text-slate-400">
        <p>&copy; ${new Date().getFullYear()} StreamHub Elite. All Rights Reserved. 18+ Adult Content.</p>
    </footer>

    <script>
        function getFavorites() {
            try { return JSON.parse(localStorage.getItem('streamhub_favs')) || []; }
            catch (e) { return []; }
        }
        function setFavorites(list) {
            localStorage.setItem('streamhub_favs', JSON.stringify(list));
            document.querySelectorAll('#favNavCount').forEach(el => el.textContent = list.length);
        }
        function toggleFavorite(id, title, thumb, href) {
            const favs = getFavorites();
            const idx = favs.findIndex(f => f.id === id);
            if (idx > -1) favs.splice(idx, 1);
            else favs.push({ id, title, thumb, href });
            setFavorites(favs);
            paintFavoriteButtons();
        }
        function paintFavoriteButtons() {
            const favs = getFavorites();
            document.querySelectorAll('[data-fav-id]').forEach(btn => {
                const isSaved = favs.some(f => String(f.id) === btn.getAttribute('data-fav-id'));
                btn.textContent = isSaved ? '❤' : '♡';
            });
        }
        document.addEventListener('DOMContentLoaded', () => {
            setFavorites(getFavorites());
            paintFavoriteButtons();
        });
    </script>
</body>
</html>`;
}

function renderSlider(label, items, hrefBuilder) {
    const links = items.map(item => `
        <a href="${hrefBuilder(item)}" class="shrink-0 px-3 py-1.5 bg-slate-900 border border-slate-800 text-xs rounded-full text-slate-300 hover:text-red-400 hover:border-red-500/40 whitespace-nowrap">${item.label || item}</a>
    `).join('');
    return `
        <div class="mb-4">
            <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">${label}</span>
            <div class="flex gap-2 overflow-x-auto no-scrollbar pb-1">${links}</div>
        </div>
    `;
}

function renderAccordion(label, items, hrefBuilder) {
    const links = items.map(item => `
        <a href="${hrefBuilder(item)}" class="px-3 py-1.5 bg-slate-900 border border-slate-800 text-xs rounded-full text-slate-300 hover:text-red-400 hover:border-red-500/40 whitespace-nowrap">${item.label || item}</a>
    `).join('');
    return `
        <details class="bg-slate-900/40 border border-slate-800 rounded-lg h-fit">
            <summary class="cursor-pointer select-none px-4 py-3 text-sm font-bold text-slate-200 flex items-center justify-between gap-2">
                <span class="truncate">${label} <span class="text-slate-400 font-normal">(${items.length})</span></span>
                <span class="text-slate-400 text-[10px] whitespace-nowrap">tap ▾</span>
            </summary>
            <div class="flex flex-wrap gap-2 p-4 pt-0 max-h-64 overflow-y-auto">${links}</div>
        </details>
    `;
}

function renderAccordionGrid(...accordionHtmlBlocks) {
    return `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            ${accordionHtmlBlocks.join('')}
        </div>
    `;
}

function renderPreviewStrip(videos, count = 6) {
    const preview = videos.slice(0, count);
    if (preview.length === 0) return '';
    const thumbs = preview.map(v => {
        const href = `/video/${v.id}/${toSlug(v.title)}`;
        return `
            <a href="${href}" class="flex-shrink-0 w-28 sm:w-32">
                <img src="${v.default_thumb.src}" alt="${v.title}" width="128" height="80" decoding="async" class="w-28 sm:w-32 h-20 object-cover rounded-md border border-slate-800" loading="lazy">
            </a>`;
    }).join('');
    return `
        <div class="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-1 px-1">
            ${thumbs}
        </div>
    `;
}

function renderVideoGrid(videos, adType = 'bucket') {
    let html = '';
    videos.forEach((v, index) => {
        const href = `/video/${v.id}/${toSlug(v.title)}`;
        const safeTitle = v.title.replace(/'/g, "\\'");
        const hoverAttrs = v.embed
            ? `onmouseenter="playHoverPreview(this, '${v.embed}')" onmouseleave="stopHoverPreview(this)"`
            : '';
        html += `
            <div class="bg-slate-900 rounded-lg overflow-hidden border border-slate-800 relative" ${hoverAttrs}>
                <button data-fav-id="${v.id}" onclick="toggleFavorite('${v.id}', '${safeTitle}', '${v.default_thumb.src}', '${href}')" class="absolute top-2 right-2 z-10 w-7 h-7 bg-slate-950/80 rounded-lg flex items-center justify-center text-sm border border-slate-800">♡</button>
                <a href="${href}">
                    <div class="relative w-full h-48 preview-thumb-wrap">
                        <img src="${v.default_thumb.src}" alt="${v.title}" width="320" height="192" decoding="async" class="w-full h-48 object-cover" loading="lazy">
                    </div>
                    <div class="p-3">
                        <h2 class="text-sm font-bold truncate text-slate-200">${v.title}</h2>
                        <span class="text-xs text-slate-400 font-mono">${v.length_min} mins</span>
                    </div>
                </a>
            </div>
        `;
        
        // Insert ad after every 5th video
        if (adType !== 'none' && (index + 1) % 5 === 0) {
            html += EVERY_5TH_VIDEO_AD;
        }
    });
    return html;
}

const HOVER_PREVIEW_SCRIPT = `
<script>
function playHoverPreview(card, embedUrl) {
    if (card.dataset.previewActive) return;
    card.dataset.previewActive = '1';
    const wrap = card.querySelector('.preview-thumb-wrap');
    if (!wrap) return;
    const iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.className = 'absolute inset-0 w-full h-full border-0';
    iframe.setAttribute('allow', 'autoplay; fullscreen');
    iframe.setAttribute('muted', 'true');
    iframe.dataset.hoverPreview = '1';
    wrap.appendChild(iframe);
}
function stopHoverPreview(card) {
    delete card.dataset.previewActive;
    const wrap = card.querySelector('.preview-thumb-wrap');
    if (!wrap) return;
    const frame = wrap.querySelector('[data-hover-preview]');
    if (frame) frame.remove();
}
</script>
`;

// -------------------------------------------------------------
// 4. ROUTES
// -------------------------------------------------------------

app.get('/', async (req, res) => {
    try {
        const [brazzersRes, trendingRes, latestRes] = await Promise.allSettled([
            cachedGet('home:brazzers', 'https://www.eporner.com/api/v2/video/search/?query=Brazzers&per_page=8&thumbsize=big&hd=1'),
            cachedGet('home:trending', 'https://www.eporner.com/api/v2/video/search/?order=top-weekly&per_page=12&thumbsize=big&hd=1'),
            cachedGet('home:latest', 'https://www.eporner.com/api/v2/video/search/?order=latest&per_page=12&thumbsize=big&hd=1'),
        ]);

        const brazzersVideos = brazzersRes.status === 'fulfilled' ? (brazzersRes.value.videos || []) : [];
        const trendingVideos = trendingRes.status === 'fulfilled' ? (trendingRes.value.videos || []) : [];
        const latestVideos = latestRes.status === 'fulfilled' ? (latestRes.value.videos || []) : [];

        const topKeywords = extractTopKeywords([brazzersVideos, trendingVideos, latestVideos]);
        cache.set('trending-keywords', { data: topKeywords, time: Date.now() });

        const content = `
            ${renderSlider('Trending Keywords', topKeywords.map(kw => ({ label: kw, slug: toSlug(kw) })), k => `/keyword/${k.slug}`)}

            ${renderAccordionGrid(
                renderAccordion('Channels', CHANNELS, ch => `/channel/${ch.slug}`),
                renderAccordion('Categories', CATEGORIES, c => `/tag/${c.slug}`),
                renderAccordion('Country / Region', COUNTRIES, c => `/tag/${c.slug}`),
                renderAccordion('Performers', PERFORMERS, p => `/star/${p.slug}`)
            )}

            <div class="mb-8 mt-6">
                <div class="flex justify-between items-center mb-4">
                    <h1 class="text-2xl font-bold text-red-500">Brazzers</h1>
                    <a href="/channel/brazzers" class="text-xs text-slate-400 hover:text-red-400">View all →</a>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">${renderVideoGrid(brazzersVideos, 'bucket')}</div>
            </div>

            <div class="mb-8">
                <h2 class="text-xl font-bold mb-4 text-slate-200">Trending This Week</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">${renderVideoGrid(trendingVideos, 'bucket')}</div>
            </div>

            <div class="mb-8">
                <h2 class="text-xl font-bold mb-4 text-slate-200">Latest Uploads</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">${renderVideoGrid(latestVideos, 'bucket')}</div>
            </div>
        `;

        res.send(renderHTMLPage({
            title: 'StreamHub Elite | Brazzers, Trending & Latest HD Streams',
            description: 'Watch Brazzers scenes plus trending and newly uploaded HD streams, updated daily.',
            keywords: ['Brazzers', ...CATEGORIES.map(c => c.label), ...PERFORMERS.map(p => p.label)].join(', '),
            canonicalPath: '/',
            contentHtml: content
        }));
    } catch (err) {
        res.status(503).send("We're temporarily unable to load the home feed. Please try again shortly.");
    }
});

app.get('/tag/:slug', async (req, res) => {
    const category = findBySlug(CATEGORIES, req.params.slug);
    if (!category) return res.status(404).send('Category not found');
    const order = safeOrder(req.query.order);
    const page = safePage(req.query.page);

    try {
        const data = await cachedGet(
            `tag:${category.slug}:${order}:${page}`,
            `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(category.label)}&order=${order}&page=${page}&per_page=${PER_PAGE}&thumbsize=big&hd=1`
        );
        const videos = data.videos || [];
        const hasMore = videos.length === PER_PAGE;

        const content = `
            ${renderAccordionGrid(
                renderAccordion('Channels', CHANNELS, ch => `/channel/${ch.slug}`),
                renderAccordion('Categories', CATEGORIES, c => `/tag/${c.slug}`),
                renderAccordion('Country / Region', COUNTRIES, c => `/tag/${c.slug}`)
            )}
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2 mt-4">
                <h1 class="text-2xl font-bold text-red-500">${category.label} Videos</h1>
                <div class="flex gap-2">${renderSortLinks(`/tag/${category.slug}`, order)}</div>
            </div>
            <p class="text-sm text-slate-400 mb-2">${getDescription('tag', category.slug, category.blurb)}</p>
            ${renderPreviewStrip(videos)}
            ${renderPagination(`/tag/${category.slug}`, order, page, hasMore)}
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">${renderVideoGrid(videos, 'bucket')}</div>
            ${renderPagination(`/tag/${category.slug}`, order, page, hasMore)}
        `;

        res.send(renderHTMLPage({
            title: `Watch ${category.label} HD Streaming Clips - StreamHub Elite`,
            description: getDescription('tag', category.slug, category.blurb),
            keywords: `${category.label}, adult videos, hd streaming`,
            canonicalPath: `/tag/${category.slug}`,
            contentHtml: content
        }));
    } catch (err) {
        res.status(503).send('This category is temporarily unavailable. Please try again shortly.');
    }
});

app.get('/channel/:slug', async (req, res) => {
    const channel = findBySlug(CHANNELS, req.params.slug);
    if (!channel) return res.status(404).send('Channel not found');
    const order = safeOrder(req.query.order);
    const page = safePage(req.query.page);

    try {
        const data = await cachedGet(
            `channel:${channel.slug}:${order}:${page}`,
            `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(channel.label)}&order=${order}&page=${page}&per_page=${PER_PAGE}&thumbsize=big&hd=1`
        );
        const videos = data.videos || [];
        const hasMore = videos.length === PER_PAGE;

        const content = `
            ${renderAccordion('Channels', CHANNELS, ch => `/channel/${ch.slug}`)}
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2 mt-4">
                <h1 class="text-2xl font-bold text-red-500">${channel.label}</h1>
                <div class="flex gap-2">${renderSortLinks(`/channel/${channel.slug}`, order)}</div>
            </div>
            <p class="text-sm text-slate-400 mb-2">${getDescription('channel', channel.slug, channel.blurb)}</p>
            ${renderPreviewStrip(videos)}
            ${renderPagination(`/channel/${channel.slug}`, order, page, hasMore)}
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">${renderVideoGrid(videos, 'bucket')}</div>
            ${renderPagination(`/channel/${channel.slug}`, order, page, hasMore)}
        `;

        res.send(renderHTMLPage({
            title: `${channel.label} Videos - HD Streaming - StreamHub Elite`,
            description: getDescription('channel', channel.slug, channel.blurb),
            keywords: `${channel.label}, adult videos, hd streaming`,
            canonicalPath: `/channel/${channel.slug}`,
            contentHtml: content
        }));
    } catch (err) {
        res.status(503).send('This channel page is temporarily unavailable. Please try again shortly.');
    }
});

app.get('/star/:slug', async (req, res) => {
    const performer = findBySlug(PERFORMERS, req.params.slug);
    if (!performer) return res.status(404).send('Performer not found');
    const order = safeOrder(req.query.order);
    const page = safePage(req.query.page);

    try {
        const data = await cachedGet(
            `star:${performer.slug}:${order}:${page}`,
            `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(performer.label)}&order=${order}&page=${page}&per_page=${PER_PAGE}&thumbsize=big&hd=1`
        );
        const videos = data.videos || [];
        const hasMore = videos.length === PER_PAGE;

        const content = `
            ${renderAccordionGrid(
                renderAccordion('Performers', PERFORMERS, p => `/star/${p.slug}`),
                renderAccordion('Channels', CHANNELS, ch => `/channel/${ch.slug}`)
            )}
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2 mt-4">
                <h1 class="text-2xl font-bold text-red-500">${performer.label}</h1>
                <div class="flex gap-2">${renderSortLinks(`/star/${performer.slug}`, order)}</div>
            </div>
            <p class="text-sm text-slate-400 mb-2">${getDescription('star', performer.slug, performer.blurb)}</p>
            ${renderBioSection(performer.slug)}
            ${renderPreviewStrip(videos)}
            ${renderPagination(`/star/${performer.slug}`, order, page, hasMore)}
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">${renderVideoGrid(videos, 'bucket')}</div>
            ${renderPagination(`/star/${performer.slug}`, order, page, hasMore)}
        `;

        res.send(renderHTMLPage({
            title: `${performer.label} - HD Videos - StreamHub Elite`,
            description: getDescription('star', performer.slug, performer.blurb),
            keywords: `${performer.label}, adult videos, hd streaming`,
            canonicalPath: `/star/${performer.slug}`,
            contentHtml: content
        }));
    } catch (err) {
        res.status(503).send('This page is temporarily unavailable. Please try again shortly.');
    }
});

app.get('/keyword/:slug', async (req, res) => {
    const slug = req.params.slug;
    const term = fromSlug(slug);
    const order = safeOrder(req.query.order);
    const page = safePage(req.query.page);

    try {
        const data = await cachedGet(
            `keyword:${slug}:${order}:${page}`,
            `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(term)}&order=${order}&page=${page}&per_page=${PER_PAGE}&thumbsize=big&hd=1`
        );
        const videos = data.videos || [];
        if (videos.length === 0) return res.status(404).send('No results for this keyword');
        const hasMore = videos.length === PER_PAGE;

        const content = `
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                <h1 class="text-2xl font-bold text-red-500">${term} Videos</h1>
                <div class="flex gap-2">${renderSortLinks(`/keyword/${slug}`, order)}</div>
            </div>
            <p class="text-sm text-slate-400 mb-6">Currently trending clips matching "${term}".</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">${renderVideoGrid(videos, 'bucket')}</div>
            ${renderPagination(`/keyword/${slug}`, order, page, hasMore)}
        `;

        res.send(renderHTMLPage({
            title: `${term} Videos - Trending HD Clips - StreamHub Elite`,
            description: `Watch trending ${term} HD video clips, updated as new content trends.`,
            keywords: `${term}, trending, adult videos`,
            canonicalPath: `/keyword/${slug}`,
            contentHtml: content
        }));
    } catch (err) {
        res.status(503).send('This page is temporarily unavailable. Please try again shortly.');
    }
});

app.get('/favorites', (req, res) => {
    const content = `
        <h1 class="text-2xl font-bold mb-6 text-red-500">My Saved Videos</h1>
        <div id="favGrid" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"></div>
        <p id="favEmpty" class="text-sm text-slate-400 hidden">You haven't saved any videos yet. Tap the ♡ icon on any video to save it here.</p>
        <script>
            (function() {
                const favs = JSON.parse(localStorage.getItem('streamhub_favs') || '[]');
                const grid = document.getElementById('favGrid');
                const empty = document.getElementById('favEmpty');
                if (favs.length === 0) {
                    empty.classList.remove('hidden');
                    return;
                }
                favs.forEach(f => {
                    const div = document.createElement('div');
                    div.className = 'bg-slate-900 rounded-lg overflow-hidden border border-slate-800 relative';
                    div.innerHTML = \`
                        <button data-fav-id="\${f.id}" onclick="toggleFavorite('\${f.id}', '', '', '')" class="absolute top-2 right-2 z-10 w-7 h-7 bg-slate-950/80 rounded-lg flex items-center justify-center text-sm border border-slate-800">❤</button>
                        <a href="\${f.href}">
                            <img src="\${f.thumb}" alt="\${f.title}" width="320" height="192" decoding="async" class="w-full h-48 object-cover" loading="lazy">
                            <div class="p-3"><h2 class="text-sm font-bold truncate text-slate-200">\${f.title}</h2></div>
                        </a>\`;
                    grid.appendChild(div);
                });
            })();
        </script>
    `;

    res.send(renderHTMLPage({
        title: 'My Saved Videos - StreamHub Elite',
        description: 'Videos you have saved for later.',
        keywords: '',
        canonicalPath: '/favorites',
        contentHtml: content,
        robotsMeta: 'noindex, nofollow'
    }));
});

app.get('/search', (req, res) => {
    const q = req.query.q || '';
    const catMatch = CATEGORIES.find(c => c.label.toLowerCase() === q.toLowerCase() || c.slug === toSlug(q));
    if (catMatch) return res.redirect(`/tag/${catMatch.slug}`);
    const starMatch = PERFORMERS.find(p => p.label.toLowerCase() === q.toLowerCase() || p.slug === toSlug(q));
    if (starMatch) return res.redirect(`/star/${starMatch.slug}`);
    const channelMatch = CHANNELS.find(ch => ch.label.toLowerCase() === q.toLowerCase() || ch.slug === toSlug(q));
    if (channelMatch) return res.redirect(`/channel/${channelMatch.slug}`);
    if (q.trim()) return res.redirect(`/keyword/${toSlug(q)}`);
    res.redirect('/');
});

app.get('/video/:id/:slug?', async (req, res) => {
    const { id } = req.params;
    try {
        const video = await cachedGet(`video:${id}`, `https://www.eporner.com/api/v2/video/id/?id=${id}`);
        if (!video || !video.embed) return res.status(404).send('Video Not Found');

        const jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'VideoObject',
            name: video.title,
            description: video.title,
            thumbnailUrl: video.default_thumb ? video.default_thumb.src : undefined,
            uploadDate: video.added || undefined,
            duration: video.length_sec ? `PT${video.length_sec}S` : undefined,
            embedUrl: video.embed,
            contentUrl: video.url || undefined
        };

        const keywordList = (video.keywords || '')
            .split(',')
            .map(k => k.trim())
            .filter(Boolean);

        const haystack = `${video.title} ${video.keywords || ''}`.toLowerCase();
        const matchedPerformer = PERFORMERS.find(p => haystack.includes(p.label.toLowerCase()));
        const matchedCategory = CATEGORIES.find(c => haystack.includes(c.label.toLowerCase()));

        const candidateQueries = [
            matchedPerformer ? matchedPerformer.label : null,
            matchedCategory ? matchedCategory.label : null,
            ...keywordList.slice(0, 3),
            video.title,
            'trending'
        ].filter(Boolean);

        let relatedVideos = [];
        for (const candidate of candidateQueries) {
            try {
                const relatedData = await cachedGet(
                    `related:${candidate}`,
                    `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(candidate)}&order=top-weekly&per_page=8&thumbsize=big&hd=1`
                );
                const filtered = (relatedData.videos || []).filter(v => String(v.id) !== String(id));
                if (filtered.length >= 5) {
                    relatedVideos = filtered.slice(0, 5);
                    break;
                }
                if (filtered.length > relatedVideos.length) {
                    relatedVideos = filtered.slice(0, 5);
                }
            } catch (err) {}
        }

        const relatedHtml = relatedVideos.length > 0 ? `
            <div class="mt-8">
                <h2 class="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wide">Related Videos</h2>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    ${renderVideoGrid(relatedVideos, 'none')}
                </div>
            </div>
            <div class="mt-6">
                ${EVERY_5TH_VIDEO_AD}
            </div>
        ` : '';

        const keywordTagsHtml = keywordList.length > 0 ? `
            <div class="flex flex-wrap gap-2 mb-6">
                ${keywordList.slice(0, 12).map(kw => `
                    <a href="/search?q=${encodeURIComponent(kw)}" class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-full border border-slate-700 transition-colors">${kw}</a>
                `).join('')}
            </div>
        ` : '';

        const content = `
            <div class="max-w-4xl mx-auto">
                <h1 class="text-xl font-bold mb-4 text-slate-100">${video.title}</h1>
                <div class="relative w-full pb-[56.25%] bg-black rounded-xl overflow-hidden mb-6 border border-slate-800">
                    <iframe src="${video.embed}" class="absolute top-0 left-0 w-full h-full border-0" allowfullscreen></iframe>
                </div>
                <div class="bg-slate-900 p-4 rounded-xl border border-slate-800 mb-6">
                    <p class="text-xs text-slate-400 font-mono">Duration: ${video.length_sec ? Math.round(video.length_sec/60) : video.length_min} mins | Rating: ★ ${video.rate || '4.8'}</p>
                </div>
                ${keywordTagsHtml}
                ${FLOAT_AD_PLAYER_SCRIPT}
                ${relatedHtml}
            </div>
        `;

        res.send(renderHTMLPage({
            title: `${video.title} - Watch HD Stream - StreamHub Elite`,
            description: `Watch ${video.title} in full HD online streaming.`,
            keywords: video.keywords || 'hd video, adult stream',
            canonicalPath: `/video/${id}/${toSlug(video.title)}`,
            contentHtml: content,
            ogImage: video.default_thumb ? video.default_thumb.src : undefined,
            jsonLd
        }));
    } catch (err) {
        res.status(503).send('Video temporarily unavailable. Please try again shortly.');
    }
});

// -------------------------------------------------------------
// 5. CSS & SITEMAPS
// -------------------------------------------------------------
let COMPILED_CSS = '';
try {
    COMPILED_CSS = fs.readFileSync(path.join(__dirname, '..', 'public', 'styles.css'), 'utf8');
} catch (err) {
    COMPILED_CSS = '';
}

app.get('/styles.css', (req, res) => {
    res.header('Content-Type', 'text/css');
    res.header('Cache-Control', 'public, max-age=86400');
    res.send(COMPILED_CSS);
});

const VIDEO_API_PER_PAGE = 100;
const URLS_PER_SITEMAP_FILE = 1000;
const API_PAGES_PER_FILE = URLS_PER_SITEMAP_FILE / VIDEO_API_PER_PAGE;
const VIDEO_SITEMAP_PAGES = 40;

app.get('/sitemap.xml', (req, res) => {
    res.header('Content-Type', 'application/xml');
    const now = new Date().toISOString();

    const videoSitemapEntries = Array.from({ length: VIDEO_SITEMAP_PAGES }, (_, i) => `
    <sitemap>
        <loc>${DOMAIN}/sitemap-videos-${i + 1}.xml</loc>
        <lastmod>${now}</lastmod>
    </sitemap>`).join('');

    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <sitemap>
        <loc>${DOMAIN}/sitemap-categories.xml</loc>
        <lastmod>${now}</lastmod>
    </sitemap>
    <sitemap>
        <loc>${DOMAIN}/sitemap-performers.xml</loc>
        <lastmod>${now}</lastmod>
    </sitemap>
    <sitemap>
        <loc>${DOMAIN}/sitemap-channels.xml</loc>
        <lastmod>${now}</lastmod>
    </sitemap>
    ${videoSitemapEntries}
    <sitemap>
        <loc>${DOMAIN}/sitemap-keywords.xml</loc>
        <lastmod>${now}</lastmod>
    </sitemap>
</sitemapindex>`);
});

app.get('/sitemap-categories.xml', (req, res) => {
    res.header('Content-Type', 'application/xml');
    const urls = CATEGORIES.map(c => `
    <url>
        <loc>${DOMAIN}/tag/${c.slug}</loc>
        <changefreq>daily</changefreq>
        <priority>${c.slug === 'brazzers' ? '1.0' : '0.8'}</priority>
    </url>`).join('');

    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${DOMAIN}/</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    ${urls}
</urlset>`);
});

app.get('/sitemap-performers.xml', (req, res) => {
    res.header('Content-Type', 'application/xml');
    const urls = PERFORMERS.map(p => `
    <url>
        <loc>${DOMAIN}/star/${p.slug}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
    </url>`).join('');

    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls}
</urlset>`);
});

app.get('/sitemap-channels.xml', (req, res) => {
    res.header('Content-Type', 'application/xml');
    const urls = CHANNELS.map(ch => `
    <url>
        <loc>${DOMAIN}/channel/${ch.slug}</loc>
        <changefreq>daily</changefreq>
        <priority>${ch.slug === 'brazzers' ? '1.0' : '0.8'}</priority>
    </url>`).join('');

    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls}
</urlset>`);
});

app.get('/sitemap-keywords.xml', async (req, res) => {
    res.header('Content-Type', 'application/xml');
    try {
        let cached = cache.get('trending-keywords');
        let keywords = cached ? cached.data : [];
        if (keywords.length === 0) {
            const data = await cachedGet('home:trending', 'https://www.eporner.com/api/v2/video/search/?order=top-weekly&per_page=12&thumbsize=big&hd=1');
            keywords = extractTopKeywords(data.videos || []);
        }

        const urls = keywords.map(kw => `
    <url>
        <loc>${DOMAIN}/keyword/${toSlug(kw)}</loc>
        <changefreq>daily</changefreq>
        <priority>0.6</priority>
    </url>`).join('');

        res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls}
</urlset>`);
    } catch (err) {
        res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`);
    }
});

app.get('/sitemap-videos-:page.xml', async (req, res) => {
    res.header('Content-Type', 'application/xml');
    const page = parseInt(req.params.page, 10);
    if (!Number.isInteger(page) || page < 1 || page > VIDEO_SITEMAP_PAGES) {
        return res.status(404).send('Sitemap page not found');
    }

    try {
        const firstApiPage = (page - 1) * API_PAGES_PER_FILE + 1;
        const apiPages = Array.from({ length: API_PAGES_PER_FILE }, (_, i) => firstApiPage + i);

        const results = await Promise.all(apiPages.map(apiPage =>
            cachedGet(
                `sitemap:videos:${apiPage}`,
                `https://www.eporner.com/api/v2/video/search/?order=latest&page=${apiPage}&per_page=${VIDEO_API_PER_PAGE}&thumbsize=big&hd=1`
            ).catch(() => ({ videos: [] }))
        ));

        const seen = new Set();
        const videos = [];
        for (const data of results) {
            for (const v of (data.videos || [])) {
                if (!seen.has(v.id)) {
                    seen.add(v.id);
                    videos.push(v);
                }
            }
        }

        const urls = videos.map(v => {
            const rawDuration = Math.round(Number(v.length_sec));
            const hasValidDuration = Number.isFinite(rawDuration) && rawDuration >= 1 && rawDuration <= 28800;
            const durationTag = hasValidDuration ? `<video:duration>${rawDuration}</video:duration>` : '';

            return `
    <url>
        <loc>${DOMAIN}/video/${v.id}/${toSlug(v.title)}</loc>
        <video:video>
            <video:thumbnail_loc>${v.default_thumb.src}</video:thumbnail_loc>
            <video:title><![CDATA[${v.title}]]></video:title>
            <video:description><![CDATA[${v.title}]]></video:description>
            ${durationTag}
        </video:video>
    </url>`;
        }).join('');

        res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
    ${urls}
</urlset>`);
    } catch (err) {
        res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`);
    }
});

module.exports = app;
module.exports.CHANNELS = CHANNELS;
module.exports.CATEGORIES = CATEGORIES;
module.exports.PERFORMERS = PERFORMERS;