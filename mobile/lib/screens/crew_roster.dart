import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../config.dart';

class CrewRosterScreen extends StatefulWidget {
  final String token;
  final VoidCallback onLogout;

  const CrewRosterScreen({
    Key? key,
    required this.token,
    required this.onLogout,
  }) : super(key: key);

  @override
  _CrewRosterScreenState createState() => _CrewRosterScreenState();
}

class _CrewRosterScreenState extends State<CrewRosterScreen> {
  List<dynamic> users = [];
  List<dynamic> bookings = [];
  List<dynamic> duties = [];
  DateTime viewDate = DateTime.now();

  bool isLoading = true;
  String errorMsg = '';
  
  String? currentUserRole;

  @override
  void initState() {
    super.initState();
    _decodeRole();
    fetchData();
  }

  void _decodeRole() {
    try {
      final parts = widget.token.split('.');
      if (parts.length == 3) {
        String payload = parts[1];
        // Ensure base64 padding is correct
        final padding = payload.length % 4;
        if (padding != 0) {
          payload += '=' * (4 - padding);
        }
        final decoded = utf8.decode(base64Url.decode(payload));
        final payloadMap = jsonDecode(decoded);
        if (payloadMap.containsKey('role')) {
          currentUserRole = payloadMap['role'];
        }
      }
    } catch (e) {
      // Ignore decoding errors
    }
  }

  Future<void> fetchData() async {
    setState(() {
      isLoading = true;
    });
    try {
      final responses = await Future.wait([
        http.get(Uri.parse('${Config.baseUrl}/users/'), headers: {'Authorization': 'Bearer ${widget.token}'}),
        http.get(Uri.parse('${Config.baseUrl}/bookings/'), headers: {'Authorization': 'Bearer ${widget.token}'}),
        http.get(Uri.parse('${Config.baseUrl}/duties/'), headers: {'Authorization': 'Bearer ${widget.token}'}),
      ]);

      final uRes = responses[0];
      final bRes = responses[1];
      final dRes = responses[2];

      if (uRes.statusCode == 200) {
        final uData = jsonDecode(uRes.body) as List;
        users = uData.where((u) {
          final role = u['role'] as String?;
          return ['Instructor', 'Examiner', 'Operations Officer', 'Maintenance Engineer'].contains(role);
        }).toList();
      }
      if (bRes.statusCode == 200) {
        bookings = jsonDecode(bRes.body) as List;
      }
      if (dRes.statusCode == 200) {
        duties = jsonDecode(dRes.body) as List;
      }
    } catch (e) {
      print('Error fetching data: $e');
    } finally {
      if (mounted) {
        setState(() {
          isLoading = false;
        });
      }
    }
  }

  List<DateTime> getDaysInWeek() {
    final days = <DateTime>[];
    DateTime startOfWeek = viewDate.subtract(Duration(days: viewDate.weekday - 1));
    for (int i = 0; i < 7; i++) {
      days.add(startOfWeek.add(Duration(days: i)));
    }
    return days;
  }

  List<dynamic> getEventsForUserAndDay(int userId, DateTime dateObj) {
    final targetDateStr = "${dateObj.year.toString().padLeft(4, '0')}-${dateObj.month.toString().padLeft(2, '0')}-${dateObj.day.toString().padLeft(2, '0')}";
    
    final userBookings = bookings.where((b) {
      return (b['instructor_id'] == userId || b['student_id'] == userId) &&
             b['start_time'].toString().startsWith(targetDateStr);
    }).map((b) => {
      'id': 'b-${b['id']}',
      'title': 'Flight: ${b['resource']?['name'] ?? ''}',
      'start': DateTime.parse(b['start_time']),
      'end': DateTime.parse(b['end_time']),
      'type': 'flight',
      'status': b['status'],
      'rawDutyType': null,
    }).toList();

    final userDuties = duties.where((d) {
      return d['user_id'] == userId &&
             d['start_time'].toString().startsWith(targetDateStr);
    }).map((d) => {
      'id': 'd-${d['id']}',
      'title': d['duty_type'],
      'start': DateTime.parse(d['start_time']),
      'end': DateTime.parse(d['end_time']),
      'type': 'duty',
      'status': null,
      'rawDutyType': d['duty_type'],
    }).toList();

    final combined = [...userBookings, ...userDuties];
    combined.sort((a, b) => (a['start'] as DateTime).compareTo(b['start'] as DateTime));
    return combined;
  }

  Future<void> saveDuty(int userId, String dutyType, DateTime startTime, DateTime endTime, String notes) async {
    setState(() { errorMsg = ''; });
    try {
      final res = await http.post(
        Uri.parse('${Config.baseUrl}/duties/'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${widget.token}',
        },
        body: jsonEncode({
          'user_id': userId,
          'duty_type': dutyType,
          'start_time': startTime.toUtc().toIso8601String(),
          'end_time': endTime.toUtc().toIso8601String(),
          'notes': notes,
        })
      );
      if (res.statusCode == 200 || res.statusCode == 201) {
        if (mounted) Navigator.pop(context);
        fetchData();
      } else {
        final errData = jsonDecode(res.body);
        if (mounted) {
          setState(() {
            errorMsg = errData['detail'] ?? 'Failed to assign duty';
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          errorMsg = 'Network error.';
        });
      }
    }
  }

  Future<void> deleteDuty(String dutyId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Remove Assignment?'),
        content: Text('Remove this duty assignment?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text('Remove', style: TextStyle(color: Theme.of(context).colorScheme.error)),
          ),
        ],
      )
    );
    if (confirm != true) return;

    try {
      final res = await http.delete(
        Uri.parse('${Config.baseUrl}/duties/$dutyId'),
        headers: {'Authorization': 'Bearer ${widget.token}'}
      );
      if (res.statusCode == 200 || res.statusCode == 204) {
        fetchData();
      }
    } catch (e) {
      print('Error deleting duty: $e');
    }
  }

  void _showAssignDutyModal() {
    if (users.isEmpty) return;
    int selectedUserId = users[0]['id'];
    String selectedDutyType = 'Standby';
    DateTime selectedStart = DateTime.now();
    DateTime selectedEnd = DateTime.now().add(Duration(hours: 8));
    String notes = '';
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
              child: Container(
                padding: EdgeInsets.all(16),
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('Assign Duty', style: Theme.of(context).textTheme.titleLarge),
                      SizedBox(height: 16),
                      if (errorMsg.isNotEmpty)
                        Container(
                          color: Theme.of(context).colorScheme.error.withOpacity(0.1),
                          padding: EdgeInsets.all(8),
                          margin: EdgeInsets.only(bottom: 16),
                          child: Text(errorMsg, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                        ),
                      DropdownButtonFormField<int>(
                        value: selectedUserId,
                        decoration: InputDecoration(labelText: 'Staff Member'),
                        items: users.map<DropdownMenuItem<int>>((u) {
                          return DropdownMenuItem<int>(
                            value: u['id'],
                            child: Text('${u['full_name']} (${u['role']})'),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) setModalState(() => selectedUserId = val);
                        },
                      ),
                      SizedBox(height: 16),
                      DropdownButtonFormField<String>(
                        value: selectedDutyType,
                        decoration: InputDecoration(labelText: 'Duty Type'),
                        items: ['Standby', 'Ground Training', 'Leave', 'Day Off']
                            .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                            .toList(),
                        onChanged: (val) {
                          if (val != null) setModalState(() => selectedDutyType = val);
                        },
                      ),
                      SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: InkWell(
                              onTap: () async {
                                final date = await showDatePicker(context: context, initialDate: selectedStart, firstDate: DateTime(2000), lastDate: DateTime(2100));
                                if (date != null) {
                                  final time = await showTimePicker(context: context, initialTime: TimeOfDay.fromDateTime(selectedStart));
                                  if (time != null) {
                                    setModalState(() {
                                      selectedStart = DateTime(date.year, date.month, date.day, time.hour, time.minute);
                                    });
                                  }
                                }
                              },
                              child: InputDecorator(
                                decoration: InputDecoration(labelText: 'Start Time'),
                                child: Text('${selectedStart.month}/${selectedStart.day} ${selectedStart.hour.toString().padLeft(2,'0')}:${selectedStart.minute.toString().padLeft(2,'0')}'),
                              ),
                            ),
                          ),
                          SizedBox(width: 8),
                          Expanded(
                            child: InkWell(
                              onTap: () async {
                                final date = await showDatePicker(context: context, initialDate: selectedEnd, firstDate: DateTime(2000), lastDate: DateTime(2100));
                                if (date != null) {
                                  final time = await showTimePicker(context: context, initialTime: TimeOfDay.fromDateTime(selectedEnd));
                                  if (time != null) {
                                    setModalState(() {
                                      selectedEnd = DateTime(date.year, date.month, date.day, time.hour, time.minute);
                                    });
                                  }
                                }
                              },
                              child: InputDecorator(
                                decoration: InputDecoration(labelText: 'End Time'),
                                child: Text('${selectedEnd.month}/${selectedEnd.day} ${selectedEnd.hour.toString().padLeft(2,'0')}:${selectedEnd.minute.toString().padLeft(2,'0')}'),
                              ),
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: 16),
                      TextField(
                        decoration: InputDecoration(labelText: 'Notes (Optional)', hintText: 'e.g. Airport Standby'),
                        onChanged: (val) => notes = val,
                      ),
                      SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: () {
                          saveDuty(selectedUserId, selectedDutyType, selectedStart, selectedEnd, notes);
                        },
                        child: Container(
                          width: double.infinity,
                          alignment: Alignment.center,
                          padding: EdgeInsets.symmetric(vertical: 12),
                          child: Text('Confirm Duty Assignment'),
                        ),
                      )
                    ],
                  ),
                ),
              ),
            );
          }
        );
      }
    ).whenComplete(() {
      setState(() {
        errorMsg = '';
      });
    });
  }

  Color getEventColor(Map<String, dynamic> event, bool isDark) {
    if (event['type'] == 'flight') return isDark ? Colors.blue.withOpacity(0.3) : Colors.blue.shade100;
    if (event['rawDutyType'] == 'Standby') return isDark ? Colors.orange.withOpacity(0.3) : Colors.orange.shade100;
    if (event['rawDutyType'] == 'Leave' || event['rawDutyType'] == 'Day Off') return isDark ? Colors.red.withOpacity(0.3) : Colors.red.shade100;
    return isDark ? Colors.green.withOpacity(0.3) : Colors.green.shade100; // Ground Training
  }

  Color getEventTextColor(Map<String, dynamic> event, bool isDark) {
    if (event['type'] == 'flight') return isDark ? Colors.blue.shade200 : Colors.blue.shade800;
    if (event['rawDutyType'] == 'Standby') return isDark ? Colors.orange.shade200 : Colors.orange.shade800;
    if (event['rawDutyType'] == 'Leave' || event['rawDutyType'] == 'Day Off') return isDark ? Colors.red.shade200 : Colors.red.shade800;
    return isDark ? Colors.green.shade200 : Colors.green.shade800;
  }

  @override
  Widget build(BuildContext context) {
    final days = getDaysInWeek();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colorScheme = Theme.of(context).colorScheme;
    
    final canAssignDuty = currentUserRole == null || currentUserRole == 'Administrator' || currentUserRole == 'Operations Officer';

    return Scaffold(
      appBar: AppBar(
        title: Text('Crew Roster'),
        actions: [
          if (canAssignDuty)
            IconButton(
              icon: Icon(Icons.person_add),
              onPressed: _showAssignDutyModal,
              tooltip: 'Assign Duty',
            )
        ],
      ),
      body: isLoading 
        ? Center(child: CircularProgressIndicator())
        : Column(
            children: [
              Container(
                padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                color: colorScheme.surfaceVariant,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    IconButton(
                      icon: Icon(Icons.arrow_back),
                      onPressed: () {
                        setState(() {
                          viewDate = viewDate.subtract(Duration(days: 7));
                        });
                      },
                    ),
                    Text(
                      'Week of ${days[0].month}/${days[0].day}',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                    ),
                    IconButton(
                      icon: Icon(Icons.arrow_forward),
                      onPressed: () {
                        setState(() {
                          viewDate = viewDate.add(Duration(days: 7));
                        });
                      },
                    ),
                  ],
                ),
              ),
              Expanded(
                child: SingleChildScrollView(
                  scrollDirection: Axis.vertical,
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: DataTable(
                      headingRowColor: MaterialStateProperty.all(colorScheme.surfaceVariant),
                      columnSpacing: 16,
                      dataRowMaxHeight: double.infinity,
                      dataRowMinHeight: 100,
                      columns: [
                        DataColumn(label: Text('Crew Member', style: TextStyle(fontWeight: FontWeight.bold))),
                        ...days.map((d) => DataColumn(
                          label: Text(
                            '${_getWeekday(d.weekday)} ${d.month}/${d.day}',
                            style: TextStyle(fontWeight: FontWeight.bold),
                          )
                        )).toList(),
                      ],
                      rows: users.map((u) {
                        return DataRow(
                          cells: [
                            DataCell(
                              Container(
                                width: 140,
                                padding: EdgeInsets.symmetric(vertical: 8),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(u['full_name'] ?? '', style: TextStyle(fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
                                    Text(u['role'] ?? '', style: TextStyle(fontSize: 12, color: colorScheme.onSurfaceVariant)),
                                    if (u['medical_expiry'] != null)
                                      Text(
                                        'Med Exp: ${u['medical_expiry']}',
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: DateTime.parse(u['medical_expiry']).isBefore(DateTime.now()) 
                                            ? Colors.red 
                                            : Colors.green
                                        )
                                      )
                                  ],
                                ),
                              )
                            ),
                            ...days.map((d) {
                              final events = getEventsForUserAndDay(u['id'], d);
                              return DataCell(
                                Container(
                                  width: 140,
                                  padding: EdgeInsets.symmetric(vertical: 8),
                                  alignment: Alignment.topLeft,
                                  child: events.isEmpty 
                                    ? Center(child: Text('Clear', style: TextStyle(color: colorScheme.onSurfaceVariant.withOpacity(0.5), fontSize: 12)))
                                    : Column(
                                        crossAxisAlignment: CrossAxisAlignment.stretch,
                                        children: events.map((ev) {
                                          return Container(
                                            margin: EdgeInsets.only(bottom: 4),
                                            padding: EdgeInsets.all(4),
                                            decoration: BoxDecoration(
                                              color: getEventColor(ev, isDark),
                                              border: Border.all(color: getEventTextColor(ev, isDark).withOpacity(0.5)),
                                              borderRadius: BorderRadius.circular(4),
                                            ),
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Row(
                                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                  children: [
                                                    Expanded(
                                                      child: Text(
                                                        ev['title'],
                                                        style: TextStyle(
                                                          fontSize: 12,
                                                          fontWeight: FontWeight.bold,
                                                          color: getEventTextColor(ev, isDark),
                                                        ),
                                                        overflow: TextOverflow.ellipsis,
                                                      ),
                                                    ),
                                                    if (ev['type'] == 'duty' && canAssignDuty)
                                                      GestureDetector(
                                                        onTap: () => deleteDuty(ev['id'].toString().replaceFirst('d-', '')),
                                                        child: Icon(Icons.close, size: 14, color: Colors.red),
                                                      )
                                                  ],
                                                ),
                                                Text(
                                                  '${(ev['start'] as DateTime).hour.toString().padLeft(2, '0')}:${(ev['start'] as DateTime).minute.toString().padLeft(2, '0')} - ${(ev['end'] as DateTime).hour.toString().padLeft(2, '0')}:${(ev['end'] as DateTime).minute.toString().padLeft(2, '0')}',
                                                  style: TextStyle(
                                                    fontSize: 10,
                                                    color: getEventTextColor(ev, isDark).withOpacity(0.8),
                                                  ),
                                                )
                                              ],
                                            ),
                                          );
                                        }).toList(),
                                      ),
                                )
                              );
                            }).toList(),
                          ]
                        );
                      }).toList(),
                    ),
                  ),
                ),
              ),
            ],
          ),
    );
  }

  String _getWeekday(int weekday) {
    switch (weekday) {
      case 1: return 'Mon';
      case 2: return 'Tue';
      case 3: return 'Wed';
      case 4: return 'Thu';
      case 5: return 'Fri';
      case 6: return 'Sat';
      case 7: return 'Sun';
      default: return '';
    }
  }
}
