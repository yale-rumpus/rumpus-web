# to do:

## DEVELOPERS READ THIS

### to do

- your own personal ideas
    - other than serious bugs (marked as [BUG] or [POTENTIAL BUG]) or upcoming features ([NEXT FEATURE]), I encourage you to explore your own ideas.
- enhanced themes (?)
    - if anyone has any ideas on how to do better themes, backgrounds, etc, please do so. Collaboration, including collaboration with outside non-Rumpuses is encouraged. note that this is a long-term task, and once started, you don't have to commit to it forever; thats why we are a team.
- migrate from eslint to oxlint **[POTENTIAL BUG]**
    - there is a possible future security risk staying on eslint v9
    - research or ask ai
    - make sure to test with "npm i " and "npm run dev"
    - make sure to test with vercel
    - run a lint test (usually npm lint)
    - once you are 100% sure that it works and doesnt break a single page or component, you may open a pull request
- add more effects (very dry)
    - find cool js/css effects online
    - apply the effects to the website
    - the only rule: YOU CANNOT USE AI TO MAKE THIS START TO FIINISH. you may use ai to find and impliment the effects, but you cannot tell the ai to make the whole thing from scratch. You must be an active participant in the decision making process.
    - try to avoid making the website look like every other tech startup
- add images to games
    - find out how games work (under components folder)
    - need to add images to ass game
    - talk to me to understand the vision
    - impliment the vision
    - profit
- migrate domain billing from squarespace to vercel
    - must talk to a rumpus higher up ("daddy") to see if its worth it
    - if its worth it to switch to vercel pro ($20??) then do it
    - otherwise, profit
- fix surveys page **[ BUG]**
    - not sure why this is not working. you will gain knowledge on vercel, github tokens, and more.
- hbd branch (**[NEXT FEATURE]**)
    - inspect hbd branch by doing
        - git switch hbd
        - git pull
    - think of new ideas to do
    - profit
- canvas effects branch
    - step one: go to a canvas submit page and press save webpage as (or cmd/ctrl s)
    - step 2: remove as much stuff in the folder as possible
    - step 3: add page to website
    - step 4: go on the canvas infrastructure github, and find out how they do confetti
    - step 5: add that same confetti effect to our new "fake canvas" page
    - step 6: add acknowledgement of material to README
    - step 7: profit

### checklist for jaden

anyone else reading this: if jaden missed one of the things on this agenda, send an email at jaden.lee@yale.edu

- vercel, github, and gmail login
- introduction to website and stack
- note about git and git lfs
- tell them about the dev page!!!
- show them how easy (?) it is to modify stuff.

### rules

- do not push directly to main unless you are fixing an immediate bug
  that includes:
    - serious security bugs
    - visual bugs that prevent clients from
        - viewing content
        - accessing content
    - an inaccuracy in the website
    - other similar violation

    the only exceptions to this rule is aare new article releases, and updates to the blog page (ie known bugs etc).

- when possible, create a branch and make your edits there. When finished, create a pull request so everyone can view it.
- try to condense long-term or small bug patches into one big bug fix
- when committing for the first time, add your name to the readme
