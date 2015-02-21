$(document).ready((function (schema) {
    var container = $("#container"),
        select = container.find("#selectDifficulty"),
        display = container.find("#display"),
        sidebar = container.find("#sidebar"),
        sidebarDragging = container.find("#sidebarDragging"),
        sidebarDraggingArea = container.find("#sidebarDraggingArea"),
        sidebarOptions = container.find("#sidebarOptions"),
        buttonPlay = container.find("#sidebarPlay"),
        displayScoring = container.find("#scoring"),
        displayScore = container.find("#score"),
        displayScoreBlurb = container.find("#scoreBlurb"),
        statCargo = container.find("#statCargo"),
        statWeight = container.find("#statWeight"),
        
        displayWidth = display.width(),
        displayHeight = display.height(),
        
        displayWidthMultiplier,
        displayHeightMultiplier,
        
        buildingWidth = schema.buildingWidth || (223 * .75),
        buildingHeight = schema.buildingHeight || (201 * .75),
        
        sceneryWidth = schema.sceneryWidth || (43 * 1.5),
        sceneryHeight = schema.sceneryHeight || (52 * 1.5),
        
        sourceWidth = schema.sourceWidth || 151,
        sourceHeight = schema.sourceHeight || 227,
        
        drone,
        
        droneWidth = schema.droneWidth || 56,
        droneHeight = schema.droneHeight || 56,
        droneSpeed = schema.droneSpeed || 5,
        droneWeight = schema.droneWeight || 1,
        droneDelay = schema.droneDelay || 280,
        
        cargoSpeed = schema.cargoSpeed || 3,
        cargoDelay = schema.cargoDelay || 7,
        
        framerate = 16,
        
        stages,
        
        stageNames,
        
        stageCurrent,
        
        stageSolution,
        
        interval;
    
    /**
     * 
     */
    var reset = function (schema) {
        var i = 0;
        
        stages = schema.stages;
        stageNames = Object.keys(stages);
        
        setDisplay();
        
        selectDifficulty.value = schema.startingDifficulty;
        
        Array.prototype.forEach.call(selectDifficulty.children, function (el) {
            if(el.value == schema.startingDifficulty) {
                el.selected = true;
                selectDifficulty.selectedIndex = i;
            }
            i += 1;
        });
        
        startGame(schema.startingDifficulty);
    };
    
    
    /* Gui setup
    */
    
    /**
     * 
     */
    var setDisplay = function () {
        setTriggers();
        setSelectOptions();
        
        resetDisplayScoringClasses();
        displayScoreBlurb.attr("textOriginal", displayScoreBlurb.text());
    };
    
    /**
     * 
     */
    var resetDisplayScoringClasses = function () {
        displayScoring
            .removeClass("solved")
            .removeClass("unsolved");
    };
    
    /**
     * 
     */
    var setTriggers = function () {
        select.change(setOption);
        buttonPlay.click(startPlaying);
    };
    
    /**
     * 
     */
    var setSelectOptions = function () {
        select.empty();
        
        stageNames.forEach(function (name) {
            select.append(new Option(name));
        });
    };
    
    /**
     * 
     */
    var setOption = function (event) {
        startGame(event.target.value);
        resetDisplayScoringClasses();
        displayScore.text("");
        displayScoreBlurb.text(displayScoreBlurb.attr("textOriginal"));
    };
        
    
    /* Gameplay setup
    */
    
    /**
     * 
     */
    var startGame = function (difficulty) {
        stageCurrent = stages[difficulty];
        populateGrid();
        populateSidebar();
        
        stageSolution = computeSolution(stageCurrent);
        console.log("The solution is", stageSolution);
    };
    
    /**
     * 
     */
    var populateGrid = function () {
        display.empty();
        setDisplayMultipliers();
        populateGridLines();
        populateGridScenery();
        populateGridLines();
        populateGridBuildings();
    };
    
    /**
     * 
     */
    var populateGridLines = function () {
        var i, j;
        
        for (i = 1; i < stageCurrent.height; i += 1) {
            display.append(
                $("<div>", {
                    "class": "gridline gridrow"
                }).css({
                    "margin-top": Math.round(i * displayHeightMultiplier) + "px"
                })
            );
        }
        
        for (i = 1; i < stageCurrent.width; i += 1) {
            display.append(
                $("<div>", {
                    "class": "gridline gridcol"
                }).css({
                    "margin-left": Math.round(i * displayWidthMultiplier) + "px"
                })
            );
        }
    };
    
    /**
     * 
     */
    var populateGridBuildings = function () {
        for (var key in stageCurrent.buildings) {
            display.append(createBuilding(key, stageCurrent.buildings[key]));
        }
        
        display.append(createBuilding("", {
            "position": stageCurrent.source,
            "source": true
        }));
    };
    
    /**
     * 
     */
    var createBuilding = function (name, building) {
        var className, width, height;
        
        if (building.source) {
            className = "building source";
            width = sourceWidth;
            height = sourceHeight;
        } else {
            name = "<big>" + name + "</big><br /><small>" + building.weight + " lbs</small>";
            width = buildingWidth;
            height = buildingHeight;
            className = "building";
        }
        
        return $("<div>", {
            "html": name,
            "class": className
        }).css({
            "width": width + "px",
            "height": height + "px",
            "margin-top": Math.round(building.position.y * displayHeightMultiplier - buildingHeight / 2) + "px",
            "margin-left": Math.round(building.position.x * displayWidthMultiplier - buildingWidth / 2) + "px"
        });
    };
    
    /**
     * 
     */
    var populateGridScenery = function () {
        var listings = stageCurrent.scenery,
            listing, type, i;
        
        for (type in listings) {
            listing = listings[type];
            
            for (i in listing) {
                display.append(createScenery(type, listing[i], i));
            }
        }
    };
    
    /**
     * 
     */
    var createScenery = function (name, position, i) {
        return $("<div>", {
            "class": "scenery " + name + " " + i
        }).css({
            "width": sceneryWidth + "px",
            "height": sceneryHeight + "px",
            "margin-top": Math.round(position[1] * displayHeightMultiplier - sceneryHeight / 2) + "px",
            "margin-left": Math.round(position[0] * displayWidthMultiplier - sceneryWidth / 2) + "px"
        });
    };
    
    /**
     * 
     */
    var populateSidebar = function () {
        populateSidebarOptions();
    };
    
    /**
     * 
     */
    var populateSidebarOptions = function () {
        sidebarOptions.empty();
        
        for (var key in stageCurrent.buildings) {
            sidebarOptions.append(createSidebarOption(key, stageCurrent.buildings[key]));
        }
        
        sidebarOptions.sortable({
            "containment": sidebarDraggingArea
        });
    };
    
    /**
     * 
     */
    var createSidebarOption = function (name, building) {
        return $("<li>", {
            "class": "option",
            "text": name
        });
    };
    
    
    /* Gameplay running
    */
    
    /**
     * 
     */
    var startPlaying = function () {
        var actions = sidebarOptions.children().toArray().map(function (child) {
            return child.textContent;
        });
        
        playActions(actions);
    };
    
    /**
     * 
     */
    var playActions = function (actions) {
        var total = computeDistance(actions);
        
        placeDrone(stageCurrent.source);
        moveDroneTo(actions, 0);
        updateStatsDisplay();
        
        if (stageSolution.distance === total) {
            displayScore.text("Correct!");
            displayScoring
                .addClass("solved")
                .removeClass("unsolved");
            displayScoreBlurb.text(stageSolution.distance + " volts used.");
        } else {
            displayScore.text(total + " volts used...");
            displayScoring
                .addClass("unsolved")
                .removeClass("solved");
            displayScoreBlurb.text("Lower is better! The best is " + stageSolution.distance + ".");
        }
    };
    
    /**
     * 
     */
    var computeDistance = function (actions) {
        var total = 0,
            weightTotal = Object.keys(stageCurrent.buildings).reduce(function (a, b) {
                return a + Number(stageCurrent.buildings[b].weight);
            }, 0),
            weightCurrent = weightTotal + droneWeight,
            distance, start, end, i;
        
        for (i = 0; i < actions.length - 1; i += 1) {
            start = stageCurrent.buildings[actions[i]];
            end = stageCurrent.buildings[actions[i + 1]];
            distance = distanceBetween(start.position, end.position);
            
            total += distance * weightCurrent;
            weightCurrent -= start.weight;
        }
        
        distance = distanceBetween(end.position, stageCurrent.source);
        total += distance * weightCurrent;
        
        total = Math.round(total * 100) / 100;
        
        return total;
    };
    
    /**
     * 
     */
    var computeSolution = function (schema) {
        var best = Infinity,
            places = Object.keys(schema.buildings),
            permutations = generatePermutationComputer()(places),
            distance, record, i;
        
        for (i = permutations.length - 1; i >= 0; i -= 1) {
            distance = computeDistance(permutations[i]);
            if (distance < best) {
                best = distance;
                record = permutations[i];
            }
        }
        
        return {
            "places": places,
            "order": record,
            "distance": best
        };
    };
    
    /**
     * 
     */
    var placeDrone = function (position) {
        if (drone) {
            drone.die();
            clearInterval(interval);
        }
        
        drone = new Drone({
            "x": (position.x * displayWidthMultiplier - droneWidth / 2),
            "y": (position.y * displayHeightMultiplier - droneHeight / 2)
        });
        
        display.append(drone.element);
    }
    
    /**
     * 
     */
    var moveDroneTo = function (actions, step) {
        var building = stageCurrent.buildings[actions[step]],
            endPosition = {
                "y": Math.round(building.position.y * displayHeightMultiplier - droneHeight / 2),
                "x": Math.round(building.position.x * displayWidthMultiplier - droneWidth / 2)
            };
        
        drone.face(endPosition);
        interval = setInterval(function () {
            var reachedEnd = drone.moveTo(endPosition);
            
            if (reachedEnd) {
                clearInterval(interval);
                
                drone.cargoLeft -= 1;
                drone.weightLeft -= building.weight;
                updateStatsDisplay();
                
                if (step >= actions.length - 1) {
                    setTimeout(moveDroneToSource, droneDelay);
                } else {
                    setTimeout(function () {
                        moveDroneTo(actions, step + 1);
                    }, droneDelay);
                }
            }
        }, framerate);
    };
    
    /**
     * 
     */
    var moveDroneToSource = function () {
        var endPosition = {
                "y": Math.round(stageCurrent.source.y * displayHeightMultiplier - droneHeight / 2),
                "x": Math.round(stageCurrent.source.x * displayWidthMultiplier - droneWidth / 2)
            };
        
        drone.face(endPosition);
        interval = setInterval(function () {
            var reachedEnd = drone.moveTo(endPosition);
            
            if (reachedEnd) {
                clearInterval(interval);
            }
        }, framerate);
    };
    
    /**
     * 
     */
    var updateStatsDisplay = function () {
        switch (drone.cargoLeft) {
            case 0:
                statCargo.text("");
                break;
            case 1:
                statCargo.text("1 delivery left.");
                break;
            default:
                statCargo.text(drone.cargoLeft + " deliveries left.");
                break;
        }
        
        switch (drone.weightLeft) {
            case 0:
                statWeight.text("");
                break;
            case 1:
                statWeight.text("Carrying 1 lb.");
                break;
            default:
                statWeight.text("Carrying " + drone.weightLeft + " lbs.");
                break;
        }
    };
    
    
    /* Utilities
    */
    
    /**
     * 
     */
    var setDisplayMultipliers = function () {
        displayWidthMultiplier = display.width() / stageCurrent.width;
        displayHeightMultiplier = display.height() / stageCurrent.height;
    };
    
    /**
     * 
     */
    var distanceBetween = function (start, end) {
        var x = Math.abs(start.x - end.x),
            y = Math.abs(start.y - end.y);
        
        return Math.sqrt(x*x + y*y);    
    }
    
    /**
     * http://stackoverflow.com/questions/9960908/permutations-in-javascript
     */
    var generatePermutationComputer = function () {
        var permArr = [],
            usedChars = [];

        return function permute(input) {
            var i, ch;
            for (i = 0; i < input.length; i++) {
                ch = input.splice(i, 1)[0];
                usedChars.push(ch);
                if (input.length == 0) {
                    permArr.push(usedChars.slice());
                }
                permute(input);
                input.splice(i, 0, ch);
                usedChars.pop();
            }
            return permArr;
        };
    };
    
    
    /* Floating classes
    */
    
    /**
     * 
     */
    function Floater() {
        
    }
    
    /**
     * 
     */
    Floater.prototype.reset = function (position) {
        this.position = position;
        this.element = $("<div>", {
                "class": "floating drone"
            }).css({
                "width": droneWidth + "px",
                "height": droneHeight + "px",
                "margin-top": position.y + "px",
                "margin-left": position.x + "px",
            });
    };
    
    /**
     * 
     */
    Floater.prototype.die = function () {
        this.element.remove();
    }
    
    /**
     * 
     */
    Floater.prototype.shiftPosition = function (x, y) {
        this.setPosition(
            this.position.x + (x || 0),
            this.position.y + (y || 0)
        );
    }
    
    /**
     * 
     */
    Floater.prototype.setPosition = function (x, y) {
        this.position.x = x;
        this.position.y = y;
        
        this.element.css({
            "margin-top": y + "px",
            "margin-left": x + "px"
        });
    };
    
    /**
     * 
     */
    Floater.prototype.moveTo = function (end) {
        if (this.position.x === end.x && this.position.y === end.y) {
            return true;
        }
        
        var dx = end.x - this.position.x,
            dy = end.y - this.position.y,
            angle = Math.atan(dy / dx),
            hypotenuse = Math.min(Math.sqrt(dx * dx + dy * dy), this.speed),
            dxNew = Math.abs(Math.cos(angle) * hypotenuse),
            dyNew = Math.abs(Math.sin(angle) * hypotenuse);
        
        if (dx < 0) {
            dxNew *= -1;
        }
        
        if (dy < 0) {
            dyNew *= -1;
        }
        
        this.shiftPosition(dxNew, dyNew);
        
        return Math.abs(dx) < .01 && Math.abs(dy) < .01;
    };
    
    /**
     * 
     */
    Floater.prototype.face = function (end) {
        var dx = end.x - this.position.x,
            dy = end.y - this.position.y,
            angle = Math.atan(dy / dx) * 180 / Math.PI;
        
        this.element.css("transform", "rotate(" + angle + "deg");
    }
    
    /**
     * 
     */
    function Drone(position) {
        this.reset(position);
        
        this.image = $("<img>")
                .attr("src", "images/Drone.png")
        this.element.append(this.image);
        
        for (var i = 0; i < 4; i += 1) {
            this.element.append(
                $("<img>")
                    .addClass("blade")
                    .attr("src", "images/Drone-Blade.gif")
            );
        }
        
        this.label = $("<div>").addClass("label")
        this.element.append(this.label);
        
        this.cargoLeft = Object.keys(stageCurrent.buildings).length;
        this.weightLeft = Object.keys(stageCurrent.buildings)
            .map(function (key) {
                return stageCurrent.buildings[key].weight;
            })
            .reduce(function (previous, current) {
                return previous + current;
            });
    }
    
    Drone.prototype = new Floater();
    Drone.prototype.speed = droneSpeed;
    
    /**
     * 
     */
    Drone.prototype.dropCargo = function () {
        var cargo = new Cargo(this.position);
        drone.
        cargo.drop();
    };
    
    /**
     * 
     */
    function Cargo(position) {
        this.reset(position);
        this.dropping = false;
    }
    
    Cargo.prototype = new Floater();
    
    /**
     * 
     */
    Cargo.prototype.drop = function () {
        this.dropping = setInterval(function () {
            this.shiftPosition(1);
        }, cargoSpeed);
        
        setTimeout(
            clearTimeout.bind(undefined, this.dropping), 
            cargoSpeed * cargoDelay
        );
    };
    
    
    reset(schema || {});
})({
    "startingDifficulty": "intro",
    "stages": {
        "intro": {
            "width": 6,
            "height": 3,
            "source": {
                "x": 5,
                "y": 2
            },
            "buildings": {
                "A": {
                    "weight": 1,
                    "position": {
                        "x": 1,
                        "y": 2
                    }
                },
                "B": {
                    "weight": 10,
                    "position": {
                        "x": 3,
                        "y": 1
                    }
                }
            },
            "scenery": {
                "flower": [ 
                    [4.78,0.54], 
                    [2.5,1.72], 
                    [5.47,2.87], 
                    [0.1,2], 
                    [5.14,0.14], 
                    [3.5,2.77], 
                    [3.01,1.11], 
                    [4.28,2.53], 
                    [2.54,1.78], 
                    [4.57,2.84], 
                    [0.99,1.08], 
                    [1.55,1.23], 
                    [3.7,0.97], 
                    [0.7,2.32], 
                    [4.12,2.12], 
                    [3.05,0.76], 
                    [3.3,1.65], 
                    [3.98,1.77], 
                    [5.84,0.57], 
                    [4.74,1.36], 
                    [5.86,2.33], 
                    [4.24,1.39], 
                    [4,0.45], 
                    [4.78,0.65], 
                    [5.8,2.86], 
                    [2.6,2.4], 
                    [3.59,1.46], 
                    [5.46,0.36], 
                    [4.7,1.09], 
                    [2.77,0.24], 
                    [5.24,2.06], 
                    [1.96,0.53], 
                    [1.28,2.15], 
                    [1.03,1.74], 
                    [2.09,2.36], 
                    [2.83,1.9], 
                    [2.6,2.75], 
                    [2.48,1.35], 
                    [2.15,1.86], 
                    [5.89,1.59], 
                    [5.34,1.08]
                ],
                "tree": [
                    [0, .7],
                    [0, 2.8],
                    [.21, 2.1],
                    [.35, 2.59],
                    [.7, 1.5],
                    [.7, .35],
                    [1, 1],
                    [1.5, 1],
                    [1, 1.5],
                    [1.5, .35],
                    [2, 1.4],
                    [2.1, .35],
                    [2.24, 2.8],
                    [2.45, .35],
                    [3, 2],
                    [4, 1],
                    [4.2, 1.4],
                    [4.2, 2.1],
                    [4.34, 2.94],
                    [4.9, 0.35],
                    [4.9, 1.4],
                    [5.04, 2.45],
                    [5.04, 1.75],
                    [5.11, .7],
                    [5.18, .98]
                ]
            },
            "Solution": ["B", "A"]
        },
        "easy": {
            "width": 7,
            "height": 4,
            "source": {
                "x": 5,
                "y": 3
            },
            "buildings": {
                "A": {
                    "weight": 2,
                    "position": {
                        "x": 1,
                        "y": 3
                    }
                },
                "B": {
                    "weight": 5,
                    "position": {
                        "x": 2,
                        "y": 2
                    }
                },
                "C": {
                    "weight": 10,
                    "position": {
                        "x": 5,
                        "y": 1
                    }
                }
            },
            "scenery": {
                "flower": [
                    [0.75,2.1999999999999997],
                    [1.8699999999999997,2.03],
                    [0.91,3.2199999999999998],
                    [5.49,1.54],
                    [1.31,2.02],
                    [3.4099999999999997,3.6599999999999997],
                    [2.06,1.85],
                    [3.9999999999999996,2.6],
                    [3.1,3.3899999999999997],
                    [2.44,1.9299999999999997],
                    [2.48,2.83],
                    [2.2199999999999998,0.22999999999999998],
                    [5.41,3.58],
                    [6.180000000000001,3.2199999999999998],
                    [5.57,0.26],
                    [4.53,2.84],
                    [4.32,0.64],
                    [3.1,3.6599999999999997],
                    [0.9,2.53],
                    [4.550000000000001,0.48],
                    [2.4,2.06],
                    [5.45,3.04],
                    [3.27,2.42],
                    [2.15,0.52],
                    [6.8100000000000005,3.44],
                    [3.83,2.17],
                    [1.19,3.17],
                    [3.8799999999999994,2.13],
                    [5.91,0.36],
                    [5.430000000000001,1.1],
                    [2.6999999999999997,2.83],
                    [3.7199999999999998,0.03],
                    [4.11,2.28],
                    [0.53,2.36],
                    [0.89,3.4299999999999997],
                    [5.800000000000001,3.84],
                    [1.3900000000000001,1.08],
                    [3.2199999999999998,0.9800000000000001],
                    [0.47,1.6],
                    [0.03999999999999998,0.7999999999999999],
                    [0.89,3.28],
                    [2.9299999999999997,2.04],
                    [1.07, 1.11],
                    [2.65, 0.63],
                    [0.27, 0.66],
                    [1.1, 0.94],
                    [1.45, 0.7],
                    [1.19, 0.69],
                    [0.38, 1.54],
                    [1.03, 0.63],
                    [0.55, 0.79],
                    [2.3, 1.29],
                    [1.01, 1.25],
                    [1.77, 1.29],
                    [0.27, 0.04],
                    [3.33, 1.88],
                    [1.44, 0],
                    [2.5, 0.78],
                    [1.75, 0.53],
                    [2.27, 0.16],
                    [1.3, 1.27],
                    [0.83, 0.3],
                    [0.35, 1.57]
                ],
                "tree": [
                    [-.7, 1.4],
                    [0, 1.4],
                    [.14, 2.8],
                    [.21, 2.1],
                    [1, 1],
                    [1.5, 1],
                    [1, 1.5],
                    [1.5, .35],
                    [2.1, .35],
                    [2.1, 1.75],
                    [2.14, 1.4],
                    [2.245, 3.5],
                    [2.24, 3.5],
                    [2.45, .35],
                    [2.8, 3.15],
                    [3, 2],
                    [3.5, 3.5],
                    [4, 1],
                    [4.2, 1.4],
                    [4.2, 2.1],
                    [4.34, 2.94],
                    [4.9, 0.35],
                    [5.04, 2.45],
                    [5.11, .7],
                    [5.18, .98],
                    [5.39, 2.1],
                    [5.6, .21],
                    [5.6, 2.8],
                    [5.95, .117],
                    [6.02, 1.4],
                    [6.3, 2.8]
                ]
            },
            "Solution": ["C", "B", "A"]
        },
        "medium": {
            "width": 6,
            "height": 5,
            "source": {
                "x": 5,
                "y": 4
            },
            "buildings": {
                "A": {
                    "weight": 5,
                    "position": {
                        "x": 1,
                        "y": 4
                    }
                },
                "B": {
                    "weight": 10,
                    "position": {
                        "x": 0,
                        "y": 1
                    }
                },
                "C": {
                    "weight": 5,
                    "position": {
                        "x": 4,
                        "y": 1
                    }
                },
                "D": {
                    "weight": 2,
                    "position": {
                        "x": 2,
                        "y": 1
                    }
                }
            },
            "scenery": {
                "flower": [
                    [1.25, 4.57],
                    [0.44999999999999996, 3.3],
                    [0.63, 3.06],
                    [2.23, 2.1],
                    [0.37, 4.840000000000001],
                    [5.78, 0.9600000000000001],
                    [-0.05000000000000002, 3.6199999999999997],
                    [4.5200000000000005, 2.1399999999999997],
                    [3.67, 4.63],
                    [1.8399999999999999, 4.3100000000000005],
                    [1.9699999999999998, 2.06],
                    [2.98, 2.48],
                    [5.5200000000000005, 3.82],
                    [0.14999999999999997, 3.6799999999999997],
                    [0.85, 3.33],
                    [3.7399999999999998, 0.29],
                    [1.8699999999999997, 4.0600000000000005],
                    [5.3100000000000005, 0.51],
                    [3.6399999999999997, 2.4899999999999998],
                    [1.1800000000000002, -0.06000000000000001],
                    [4.98, 1.06],
                    [2.78, 0.53],
                    [1.6800000000000002, 1.42],
                    [2.11, 0.9],
                    [5.8100000000000005, 1.6800000000000002],
                    [3.07, 0.43999999999999995],
                    [3.46, -0.04000000000000001],
                    [5.2, 4.340000000000001],
                    [1.21, 0.87],
                    [3.6, 2.1999999999999997],
                    [2.01, 2.88],
                    [0.65, 4.430000000000001],
                    [0.37, 3.36],
                    [4.62, 1.2399999999999998],
                    [4.58, 0.37],
                    [5.1000000000000005, 1.9499999999999997],
                    [0.09, -0.14],
                    [1.99, 1.72],
                    [1.9, 0.8],
                    [0.47, 2.55],
                    [1.6, 1.83],
                    [2.41, 2.63],
                    [1.49, 2.82],
                    [0.08, 2.99],
                    [4.03, 3.43],
                    [3.22, 3.14],
                    [1.1, 1.96],
                    [0.49, 0.78],
                    [0.74, 3.3],
                    [0.17, 1.27],
                    [1.85, 3.56],
                    [3.08, 0.78],
                    [3.81, 0.16],
                    [3.51, 2.57],
                    [3.37, 2.66],
                    [3.41, 0.92]
                ],
                "tree": [
                    [0, 2.24],
                    [.14, 4.2],
                    [.21, 3.5],
                    [.35, 2.8],
                    [.7, .7],
                    [.84, 1.17],
                    [1.17, 2.1],
                    [1.4, 2.8],
                    [2.1, 3.5],
                    [2.45, 2.1],
                    [2.8, 4.2],
                    [2.94, 3.5],
                    [3.01, 4.9],
                    [3.5, 2.45],
                    [3.64, 2.8],
                    [4.2, 3.5],
                    [4.45, 2.45],
                    [4.9, 3.5],
                    [5.25, 2.1],
                    [5.33, .7]
                ]
            }
        },
        "difficult": {
            "width": 6,
            "height": 5,
            "source": {
                "x": 5,
                "y": 4
            },
            "buildings": {
                "A": {
                    "weight": 5,
                    "position": {
                        "x": 3,
                        "y": 3
                    }
                },
                "B": {
                    "weight": 10,
                    "position": {
                        "x": 1,
                        "y": 3
                    }
                },
                "C": {
                    "weight": 10,
                    "position": {
                        "x": 4,
                        "y": 1
                    }
                },
                "D": {
                    "weight": 2,
                    "position": {
                        "x": 2,
                        "y": 1
                    }
                },
                "E": {
                    "weight": 5,
                    "position": {
                        "x": 5,
                        "y": 2
                    }
                },
            },
            "scenery": {
                "flower": [
                    [4.92, 0.62],
                    [2.05, 2.32],
                    [4.640000000000001, 2.6599999999999997],
                    [4.0600000000000005, 1.6],
                    [1.58, 4.470000000000001],
                    [3.3699999999999997, 2.13],
                    [4.4, 2.21],
                    [0.35, 0.84],
                    [5.78, 2.53],
                    [3.6, 2],
                    [3.9199999999999995, 4.03],
                    [5.41, 3.63],
                    [2.8, 1.27],
                    [4.07, 3.77],
                    [2.2199999999999998, 3.25],
                    [4.760000000000001, 2.6999999999999997],
                    [4.46, 4.62],
                    [3.56, 0.49],
                    [-0.12000000000000001, 0.27999999999999997],
                    [3.1, 1.27],
                    [3.23, 2.61],
                    [3.54, 1.5699999999999998],
                    [5.66, 2.59],
                    [1.79, 3.97],
                    [4.13, 1.81],
                    [1.4500000000000002, 4.3500000000000005],
                    [4.95, 0.71],
                    [5.75, 1.04],
                    [2.32, 2.01],
                    [4.28, 0.9600000000000001],
                    [3.4499999999999997, 0.62],
                    [2.82, 1.3399999999999999],
                    [2.36, 1.35],
                    [-0.12000000000000001, 3.75],
                    [2.4699999999999998, 3.19],
                    [5.550000000000001, 2.69],
                    [4.590000000000001, 4.840000000000001],
                    [4.01, 2.26],
                    [1.71, 2.82],
                    [4, 1.73],
                    [0.7, 0.69],
                    [1.53, 1.68],
                    [3.94, 3.53],
                    [0.28, 3.43],
                    [0.06, 2.63],
                    [2.06, 1.08],
                    [1.76, 2],
                    [0.06, 0.27],
                    [0.37, 0.26],
                    [1.49, 0.69],
                    [2.18, 1.06],
                    [2.46, 2.56],
                    [3.04, 2.8],
                    [4.18, 1.2],
                    [4.17, 1.74],
                    [3.39, 0.94],
                ],
                "tree": [
                    [0, 0],
                    [.07, 2.8],
                    [.21, 4.9],
                    [.35, .7],
                    [.84, 4.55],
                    [.91, 1.4],
                    [1.4, 2.1],
                    [1.75, 3.5],
                    [1.82, 4.2],
                    [2.1, 2.24],
                    [2.45, 4.41],
                    [2.52, 4.83],
                    [2.8, .7],
                    [3.15, 4.2],
                    [3.85, 3.5],
                    [3.92, 4.9],
                    [3.99, 2.1],
                    [4.2, 2.8],
                    [4.9, .35],
                    [5.25, .84],
                    [5.32, 3.5]
                ]
            }
        },
        "hard": {
            "width": 9,
            "height": 5,
            "source": {
                "x": 7,
                "y": 4,
            },
            "buildings": {
                "A": {
                    "weight": 5,
                    "position": {
                        "x": 3,
                        "y": 2
                    }
                },
                "B": {
                    "weight": 10,
                    "position": {
                        "x": 6,
                        "y": 2
                    }
                },
                "C": {
                    "weight": 7,
                    "position": {
                        "x": 1,
                        "y": 4
                    }
                },
                "D": {
                    "weight": 5,
                    "position": {
                        "x": 3,
                        "y": 4
                    }
                },
                "E": {
                    "weight": 10,
                    "position": {
                        "x": 1.5,
                        "y": 1
                    }
                },
                "F": {
                    "weight": 7,
                    "position": {
                        "x": 8,
                        "y": 1
                    }
                }
            },
            "scenery": {
                "flower": [
                    [4.3500000000000005, 2.11],
                    [8.719999999999999, 4.37],
                    [4.42, 2.86],
                    [2.38, 4.720000000000001],
                    [4.45, 0.69],
                    [6.23, 1.9899999999999998],
                    [3.13, 1.8699999999999997],
                    [6.61, 1.2999999999999998],
                    [6.5200000000000005, 3.52],
                    [7.89, 0.14999999999999997],
                    [5.090000000000001, 0.64],
                    [6.840000000000001, 4.79],
                    [3.57, 3.77],
                    [7.4, 3.02],
                    [-0.05000000000000002, 4.3500000000000005],
                    [8.709999999999999, 4.36],
                    [4.640000000000001, 0.7999999999999999],
                    [5.66, 1.8599999999999999],
                    [0.9, 3.29],
                    [6.74, 3.1199999999999997],
                    [2.44, 4.65],
                    [6.220000000000001, 2.1399999999999997],
                    [7.13, 4.5600000000000005],
                    [7.16, 3.59],
                    [6.79, 0.88],
                    [8, 2.3899999999999997],
                    [0.32, 0.9999999999999999],
                    [4.99, 1.94],
                    [8.399999999999999, 3.51],
                    [6.67, 1.6099999999999999],
                    [7.89, 0.63],
                    [6.69, 3.79],
                    [0.18, 2.02],
                    [8.399999999999999, 2.02],
                    [1.4300000000000002, 4.21],
                    [4.17, 2.6199999999999997],
                    [2.63, 3.58],
                    [4.9, 4.66],
                    [1.25, 3.03],
                    [2.67, 4.7],
                    [5.890000000000001, 0.52],
                    [1.58, 3.55],
                    [3.9599999999999995, 2.54],
                    [4.16, 0.88],
                    [2.56, 2.1799999999999997],
                    [4.28, 3.1399999999999997],
                    [7.95, 3.05],
                    [2.28, 0.21999999999999997],
                    [4.83, 1.06],
                    [7.49, 1.29],
                    [2.1999999999999997, 2.78],
                    [1.94, 0.19],
                    [1.75, 0.76],
                    [3.71, 1.03],
                    [0.05, 0.86],
                    [1.15, 3.31],
                    [2.24, 2.79],
                    [2.49, 1.46],
                    [5.42, 1.25],
                    [0.53, 2.83],
                    [0.9, 1.7],
                    [3.91, 2.08],
                    [1.51, 1.93],
                    [1.37, 3.01],
                    [2.11, 0.1],
                    [4.71, 0.79],
                    [0.33, 2.84],
                    [2.93, 1.44],
                    [4.15, 1.41],
                    [5.95, 1.22],
                    [2.42, 0.28],
                    [1.59, 0.45],
                    [2.96, 3.35],
                    [5.55, 0.8],
                    [3.63, 2.51],
                    [2.33, 1.7],
                    [3.21, 0.2],
                    [3.35, 3.4]
                ],
                "tree": [
                    [-.7, 1.4],
                    [-.35, 4.2],
                    [0, 1.4],
                    [.14, 2.8],
                    [.21, 2.1],
                    [1, .21],
                    [1, 2.1],
                    [1.4, .35],
                    [1.54, 2.94],
                    [2.245, 3.5],
                    [2.24, 3.5],
                    [2.45, .35],
                    [2.8, 3.15],
                    [3, 2],
                    [3.5, 3.5],
                    [4, 1],
                    [4.2, 1.4],
                    [4.2, 2.1],
                    [4.34, 2.94],
                    [4.9, 0.35],
                    [4.9, 4.9],
                    [5.11, .7],
                    [5.11, 3.85],
                    [5.18, .98],
                    [6.02, .117],
                    [6.09, 3.5],
                    [6.3, 4.2],
                    [7, 3.5],
                    [7.14, 2.1],
                    [7.35, 4.34],
                    [7.7, 3.5]
                ]
            }
        },
        "insane": {
            "width": 9,
            "height": 5,
            "source": {
                "x": 7,
                "y": 4,
            },
            "buildings": {
                "A": {
                    "weight": 5,
                    "position": {
                        "x": 3,
                        "y": 2
                    }
                },
                "B": {
                    "weight": 10,
                    "position": {
                        "x": 6,
                        "y": 2
                    }
                },
                "C": {
                    "weight": 7,
                    "position": {
                        "x": 1,
                        "y": 4
                    }
                },
                "D": {
                    "weight": 5,
                    "position": {
                        "x": 3,
                        "y": 4
                    }
                },
                "E": {
                    "weight": 10,
                    "position": {
                        "x": 1.5,
                        "y": 1
                    }
                },
                "F": {
                    "weight": 7,
                    "position": {
                        "x": 8,
                        "y": 1
                    }
                },
                "G": {
                    "weight": 5,
                    "position": {
                        "x": 0,
                        "y": 0.5
                    }
                },
                "H": {
                    "weight": 5,
                    "position": {
                        "x": 5,
                        "y": 4
                    }
                }
            },
            "scenery": {
                "flower": [
                    [4.3500000000000005, 2.11],
                    [8.719999999999999, 4.37],
                    [4.42, 2.86],
                    [2.38, 4.720000000000001],
                    [4.45, 0.69],
                    [6.23, 1.9899999999999998],
                    [3.13, 1.8699999999999997],
                    [6.61, 1.2999999999999998],
                    [6.5200000000000005, 3.52],
                    [7.89, 0.14999999999999997],
                    [5.090000000000001, 0.64],
                    [6.840000000000001, 4.79],
                    [3.57, 3.77],
                    [7.4, 3.02],
                    [-0.05000000000000002, 4.3500000000000005],
                    [8.709999999999999, 4.36],
                    [4.640000000000001, 0.7999999999999999],
                    [5.66, 1.8599999999999999],
                    [0.9, 3.29],
                    [6.74, 3.1199999999999997],
                    [2.44, 4.65],
                    [6.220000000000001, 2.1399999999999997],
                    [7.13, 4.5600000000000005],
                    [7.16, 3.59],
                    [6.79, 0.88],
                    [8, 2.3899999999999997],
                    [0.32, 0.9999999999999999],
                    [4.99, 1.94],
                    [8.399999999999999, 3.51],
                    [6.67, 1.6099999999999999],
                    [7.89, 0.63],
                    [6.69, 3.79],
                    [0.18, 2.02],
                    [8.399999999999999, 2.02],
                    [1.4300000000000002, 4.21],
                    [4.17, 2.6199999999999997],
                    [2.63, 3.58],
                    [4.9, 4.66],
                    [1.25, 3.03],
                    [2.67, 4.7],
                    [5.890000000000001, 0.52],
                    [1.58, 3.55],
                    [3.9599999999999995, 2.54],
                    [4.16, 0.88],
                    [2.56, 2.1799999999999997],
                    [4.28, 3.1399999999999997],
                    [7.95, 3.05],
                    [2.28, 0.21999999999999997],
                    [4.83, 1.06],
                    [7.49, 1.29],
                    [2.1999999999999997, 2.78],
                    [1.94, 0.19],
                    [1.75, 0.76],
                    [3.71, 1.03],
                    [0.05, 0.86],
                    [1.15, 3.31],
                    [2.24, 2.79],
                    [2.49, 1.46],
                    [5.42, 1.25],
                    [0.53, 2.83],
                    [0.9, 1.7],
                    [3.91, 2.08],
                    [1.51, 1.93],
                    [1.37, 3.01],
                    [2.11, 0.1],
                    [4.71, 0.79],
                    [0.33, 2.84],
                    [2.93, 1.44],
                    [4.15, 1.41],
                    [5.95, 1.22],
                    [2.42, 0.28],
                    [1.59, 0.45],
                    [2.96, 3.35],
                    [5.55, 0.8],
                    [3.63, 2.51],
                    [2.33, 1.7],
                    [3.21, 0.2],
                    [3.35, 3.4]
                ],
                "tree": [
                    [-.7, 1.4],
                    [-.35, 4.2],
                    // [0, 1.4],
                    [.14, 2.8],
                    [.21, 2.1],
                    [1, .21],
                    [1, 2.1],
                    [1.4, .35],
                    [1.54, 2.94],
                    [2.245, 3.5],
                    [2.24, 3.5],
                    [2.45, .35],
                    [2.8, 3.15],
                    [3, 2],
                    [3.5, 3.5],
                    [4, 1],
                    [4.2, 1.4],
                    [4.2, 2.1],
                    [4.34, 2.94],
                    [4.9, 0.35],
                    // [4.9, 4.9],
                    [5.11, .7],
                    // [5.11, 3.85],
                    [5.18, .98],
                    [6.02, .117],
                    [6.09, 3.5],
                    [6.3, 4.2],
                    [7, 3.5],
                    [7.14, 2.1],
                    [7.35, 4.34],
                    [7.7, 3.5]
                ]
            }
        }
    }
}));